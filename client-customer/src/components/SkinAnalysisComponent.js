import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import withRouter from '../utils/withRouter';
import '../styles/SkinAnalysis.css';

class SkinAnalysis extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      stream: null,
      image: null,
      analyzing: false,
      isRealtimeActive: false,
      result: null,
      history: [],
      error: '',
      showHistory: false,
      mode: 'camera', // camera | upload
      aiStatus: 'Hệ thống AI chuẩn bị...',
      isCameraStarted: false,
      isInitializingCamera: false
    };
    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();
    this.overlayRef = React.createRef();
    this._faceMesh = null;
    this._camera = null;
  }

  componentDidMount() {
    this.loadMediaPipe();
    this.apiGetHistory();
  }

  componentWillUnmount() {
    this.stopCamera();
    if (this._camera) {
      try { this._camera.stop(); } catch(e) {}
    }
  }

  loadMediaPipe = () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
    ];

    let loadedCount = 0;
    scripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        loadedCount++;
        if (loadedCount === scripts.length) {
          this.initAI();
        }
      };
      script.onerror = () => {
          this.setState({ aiStatus: 'Lỗi tải Script. Chế độ cơ bản.' });
          this.startStandardCamera();
      };
      document.head.appendChild(script);
    });
  };

  initAI = () => {
    // Timeout 5s để tự động chuyển sang Camera thường nếu AI không load được
    const aiTimeout = setTimeout(() => {
        if (!this._faceMesh) {
            console.log("AI Mesh timeout, falling back to standard camera...");
            this.startStandardCamera();
        }
    }, 5000);

    try {
      // eslint-disable-next-line no-undef
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(this.onAIResults);
      this._faceMesh = faceMesh;
      clearTimeout(aiTimeout);
      this.setState({ aiStatus: 'AI READY ✨' });
      
      this.startAICamera();
    } catch (err) {
      clearTimeout(aiTimeout);
      this.setState({ aiStatus: 'Chế độ Camera cơ bản' });
      this.startStandardCamera();
    }
  };

  onAIResults = (results) => {
    if (!this.overlayRef.current || !this.videoRef.current) return;
    
    const canvasCtx = this.overlayRef.current.getContext('2d');
    const width = this.overlayRef.current.width;
    const height = this.overlayRef.current.height;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      if (!this.state.isRealtimeActive) this.setState({ isRealtimeActive: true });
      
      // eslint-disable-next-line no-undef
      drawConnectors(canvasCtx, results.multiFaceLandmarks[0], FACEMESH_TESSELATION, 
        {color: 'rgba(55, 77, 41, 0.15)', lineWidth: 1});
      // eslint-disable-next-line no-undef
      drawConnectors(canvasCtx, results.multiFaceLandmarks[0], FACEMESH_RIGHT_EYE, {color: '#db9b91'});
      // eslint-disable-next-line no-undef
      drawConnectors(canvasCtx, results.multiFaceLandmarks[0], FACEMESH_LEFT_EYE, {color: '#db9b91'});
    } else {
      if (this.state.isRealtimeActive) this.setState({ isRealtimeActive: false });
    }
    canvasCtx.restore();
  };

  startAICamera = () => {
    this.stopCamera();
    
    if (this._faceMesh) {
        this.setState({ isInitializingCamera: true, error: '' });
        try {
            // Đợi một chút để video element render xong
            setTimeout(async () => {
                if (!this.videoRef.current) return;
                
                // eslint-disable-next-line no-undef
                const camera = new Camera(this.videoRef.current, {
                    onFrame: async () => {
                        try {
                          if (this._faceMesh) await this._faceMesh.send({image: this.videoRef.current});
                        } catch(e) {}
                    },
                    width: 640,
                    height: 480
                });
                this._camera = camera;
                camera.start().then(() => {
                    this.setState({ isCameraStarted: true, isInitializingCamera: false });
                }).catch(err => {
                    console.error("Camera AI Start Error:", err);
                    this.startStandardCamera();
                });
            }, 500);
        } catch (e) {
            console.error("Camera Constructor Error:", e);
            this.startStandardCamera();
        }
    } else {
        this.startStandardCamera();
    }
  };

  startStandardCamera = async () => {
    this.stopCamera();
    this.setState({ isInitializingCamera: true, error: '' });
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        this.setState({ stream }, () => {
            setTimeout(() => {
                if (this.videoRef.current) {
                    this.videoRef.current.srcObject = stream;
                    this.videoRef.current.play();
                    this.setState({ isCameraStarted: true, isInitializingCamera: false });
                }
            }, 500);
        });
    } catch (e) { 
        console.error("Standard Camera Error:", e);
        let errMsg = 'Không thể truy cập Camera.';
        if (e.name === 'NotReadableError') {
            errMsg = 'Camera đang bị ứng dụng khác sử dụng hoặc bị lỗi phần cứng. Vui lòng tắt các app camera khác và tải lại trang.';
        } else if (e.name === 'NotAllowedError') {
            errMsg = 'Bạn đã chặn quyền truy cập Camera. Vui lòng cấp quyền trong cài đặt trình duyệt.';
        }
        this.setState({ 
            isInitializingCamera: false,
            error: errMsg 
        }); 
    }
  };

  stopCamera = () => {
    // 1. Stop MediaPipe Camera helper
    if (this._camera) {
        try { 
            this._camera.stop(); 
            this._camera = null; 
        } catch(e) { console.warn("Stop MediaPipe Camera failed:", e); }
    }

    // 2. Stop individual tracks
    if (this.state.stream) {
      this.state.stream.getTracks().forEach(track => track.stop());
      this.setState({ stream: null });
    }

    // 3. Clear video element
    if (this.videoRef.current) {
        this.videoRef.current.srcObject = null;
    }
  };

  switchMode = (mode) => {
    this.setState({ mode, image: null, result: null, error: '', isCameraStarted: false, isInitializingCamera: false });
    if (this._camera) { try { this._camera.stop(); } catch(e) {} }
    this.stopCamera();
  };

  performHeuristicScan = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    let redSpotPixels = 0, darkPits = 0, textureVariation = 0, wrinkleEdges = 0, analyzedPixels = 0;
    let acnePoints = [];
    
    const startX = Math.floor(width * 0.1), endX = Math.floor(width * 0.9);
    const startY = Math.floor(height * 0.1), endY = Math.floor(height * 0.9);

    for (let y = startY; y < endY; y += 4) {
      for (let x = startX; x < endX; x += 4) {
        const i = (y * width + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        const brightness = (r + g + b) / 3;
        analyzedPixels++;

        // 1. CHẨN ĐOÁN MỤN & VIÊM (SMART FILTERING v12.0)
        // Nếu da quá sáng (Glass Skin), lọc bỏ các điểm bóng loáng
        if (brightness > 230) continue; 

        // Ngưỡng đỏ cân bằng (Không quá lệ thuộc vào Global Bias để tránh mù mụn diện rộng)
        const baseThreshold = 1.35;
        const isActuallyRed = r > g * baseThreshold;
        const isPurpleBase = r > 110 && b > 100 && r > g * 1.3; // Mụn thâm/nang
        
        if (isActuallyRed || isPurpleBase) {
          const offset = 8 * 4;
          if (i + offset < data.length) {
            const nextR = data[i + offset], nextG = data[i + offset + 1];
            const rEdge = Math.abs(r - nextR);
            const localContrast = (r - g) - (nextR - nextG);

            // Mụn thật phải có độ tương phản cục bộ hoặc cạnh sắc
            const isVividRed = r > g * 1.6;
            if ((rEdge > 12 || Math.abs(localContrast) > 15 || isVividRed) && rEdge < 75) { 
              redSpotPixels += (isVividRed ? 4 : 1);
              if (acnePoints.length < 1500) acnePoints.push({ x, y });
            }
          }
        }

        // 2. LỖ CHÂN LÔNG & ĐỘ MỊN (SENSITIVITY v15.0)
        const step = 6 * 4; 
        if (i + step < data.length) {
            const nextB = (data[i + step] + data[i + step + 1] + data[i + step + 2]) / 3;
            const diff = Math.abs(brightness - nextB);
            
            // v15.0: Ngưỡng 32 cho lỗ chân lông và 25 cho texture để lờ đi độ bóng
            // Chỉ xét texture ở vùng da không quá sáng (để tránh vệt bóng lóa)
            if (brightness < 160 && diff > 32) darkPits++;
            if (diff > 25 && brightness < 185) textureVariation++;
        }

        // 3. LÃO HÓA (Độ đàn hồi)
        const vStep = width * 8 * 4;
        if (i + vStep < data.length) {
            const vBright = (data[i + vStep] + data[i + vStep + 1] + data[i + vStep + 2]) / 3;
            if (Math.abs(brightness - vBright) > 50 && brightness < 200) wrinkleEdges++;
        }
      }
    }
    
    // --- LỌC BÁO ĐỘNG GIẢ ---
    if (redSpotPixels / analyzedPixels < 0.003) {
        redSpotPixels = 0;
        acnePoints = [];
    }

    const acneZones = [];
    acnePoints.forEach(p => {
        let added = false;
        for (let zone of acneZones) {
            if (Math.sqrt(Math.pow(p.x - zone.x, 2) + Math.pow(p.y - zone.y, 2)) < 40) { zone.points++; added = true; break; }
        }
        if (!added && acneZones.length < 50) acneZones.push({ x: p.x, y: p.y, points: 1 });
    });

    // --- CÔNG THỨC CHẤM ĐIỂM (TỈ LỆ THUẬN v16.0) ---
    // Sạch mụn là chỉ số chủ đạo
    const acneRate = (redSpotPixels / analyzedPixels) * 100;
    
    // Các chỉ số khác tỉ lệ thuận với độ sạch mụn
    // Nếu acneRate cao (nhiều mụn), các "Stress" sẽ tăng cao để kéo điểm xuống
    const overallStress = acneRate * 1.2; 

    // Tính toán dựa trên thực tế + Phạt điểm do mụn (Tỉ lệ thuận)
    const poreRate = Math.min(95, (darkPits / analyzedPixels) * 100 * 5 + overallStress * 0.8);
    const textureRate = Math.min(95, (textureVariation / analyzedPixels) * 100 * 2.5 + overallStress * 1.5);
    const wrinkleRate = Math.min(95, (wrinkleEdges / analyzedPixels) * 100 * 6 + overallStress * 0.5);
    
    return { acneRate, poreRate, wrinkleRate, textureRate, acneZones };
  };

  captureImage = () => {
    const video = this.videoRef.current;
    const canvas = this.canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg');
      
      const hints = this.performHeuristicScan(canvas);
      
      this.setState({ image: imageData, acneHighlights: hints.acneZones });
      this.apiAnalyzeSkin(imageData, hints);
      
      if (this._camera) { try { this._camera.stop(); } catch(e) {} }
      this.stopCamera();
    }
  };

  handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        this.setState({ image: imageData });
        
        // Tạo canvas ẩn để scan ảnh upload
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const hints = this.performHeuristicScan(canvas);
          this.apiAnalyzeSkin(imageData, hints);
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  };

  apiAnalyzeSkin(imageData, hints = {}) {
    const customer = this.context.customer;
    if (!customer || !this.context.token) {
      alert('Vui lòng đăng nhập lại để tiếp tục.');
      this.props.navigate('/login');
      return;
    }

    this.setState({ analyzing: true, result: null });
    const config = { headers: { 'x-access-token': this.context.token } };
    const body = { 
       image: imageData, 
       userId: customer._id,
       hints: hints // Gửi kết quả scan thô lên server
    };

    axios.post('/api/customer/skin-analysis', body, config).then((res) => {
        if (res.data.success) {
            this.setState({ result: res.data.data, analyzing: false });
            this.apiGetHistory();
        } else { this.setState({ error: 'Lỗi AI: ' + res.data.message, analyzing: false }); }
    }).catch(() => this.setState({ error: 'Lỗi mạng khi phân tích.', analyzing: false }));
  }

  apiGetHistory() {
    if (!this.context.customer || !this.context.token) return;
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get(`/api/customer/skin-analysis/history/${this.context.customer._id}`, config).then((res) => {
      this.setState({ history: res.data });
    }).catch(() => {});
  }

  apiDeleteHistoryItem = (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa kết quả này?')) return;
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.delete(`/api/customer/skin-analysis/history/${id}`, config).then((res) => {
      if (res.data.success) this.apiGetHistory();
    }).catch(() => alert('Lỗi khi xóa.'));
  };

  apiDeleteAllHistory = () => {
    if (!window.confirm('Bạn có chắc muốn xóa TOÀN BỘ lịch sử soi da?')) return;
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.delete(`/api/customer/skin-analysis/history/all/${this.context.customer._id}`, config).then((res) => {
      if (res.data.success) this.apiGetHistory();
    }).catch(() => alert('Lỗi khi xóa tất cả.'));
  };

  renderResult() {
    const { result } = this.state;
    if (!result) return null;

    // Determine if it's a "severe" case
    const isSevere = result.severity === 'nặng';

    return (
      <div className="skin-result-overlay">
        <div className="skin-result-card ab-visible">
          {/* Header */}
          <div className="skin-result-header" style={{ padding: '20px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ margin: 0, color: '#374d29', fontSize: '20px' }}>BÁO CÁO CHẨN ĐOÁN DA LIÊU</h2>
             <button className="skin-close" style={{ position: 'static' }} onClick={() => this.setState({ result: null, image: null, error: '' })}>✕</button>
          </div>
          
          <div className="skin-result-content">
            {/* Left Side: Visuals & Metrics */}
            <div className="skin-result-side-info">
               <div className="skin-avatar-wrap main-diag">
                  <img src={result.image} alt="Captured" className="skin-captured-mini" />
                  {this.state.acneHighlights && this.state.acneHighlights.map((zone, idx) => (
                    <div key={idx} className="acne-marker" style={{ 
                      left: `${(zone.x / 640) * 100}%`, 
                      top: `${(zone.y / 480) * 100}%`,
                      width: `${Math.min(50, Math.max(20, zone.points * 0.4))}px`,
                      height: `${Math.min(50, Math.max(20, zone.points * 0.4))}px`,
                      animationDelay: `${idx * 0.15}s`
                    }}></div>
                  ))}
                  <div className="skin-type-badge">{result.skinType || 'Hỗn hợp'}</div>
               </div>

               <div className="skin-metrics">
                  <div className="skin-metric">
                    <div className="skin-metric-head">
                      <span className="skin-metric-label">Độ sạch mụn</span>
                      <span className="skin-metric-val">{Math.max(5, 100 - (result.concerns?.acne || 0)).toFixed(0)}%</span>
                    </div>
                    <div className="skin-progress-bg">
                      <div className="skin-progress-fill" style={{ width: `${Math.max(5, 100 - (result.concerns?.acne || 0))}%`, background: '#db9b91' }}></div>
                    </div>
                  </div>

                  <div className="skin-metric">
                    <div className="skin-metric-head">
                      <span className="skin-metric-label">Độ mịn bề mặt</span>
                      <span className="skin-metric-val">{Math.max(5, 100 - (result.concerns?.texture || 0)).toFixed(0)}%</span>
                    </div>
                    <div className="skin-progress-bg">
                      <div className="skin-progress-fill" style={{ width: `${Math.max(5, 100 - (result.concerns?.texture || 0))}%` }}></div>
                    </div>
                  </div>
               </div>

               <div className="skin-reasons-table">
                  <h4>Dữ liệu phân tích AI</h4>
                  <div className="reason-item">
                     <span>Tình trạng:</span>
                     <p>{result.conditions || 'Đang xác định'}</p>
                  </div>
                  <div className="reason-item">
                     <span>Mức độ:</span>
                     <p style={{ color: isSevere ? '#dc2626' : '#374d29', fontWeight: 'bold' }}>
                        {result.severity === 'nhẹ' ? 'Nhẹ' : result.severity === 'trung bình' ? 'Trung bình' : 'Nặng'}
                     </p>
                  </div>
               </div>
            </div>

            {/* Right Side: Analysis & Products */}
            <div className="skin-result-main-data">
               <div className="skin-analysis-section">
                  <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>Phân tích từ chuyên gia</h3>
                  <div className="skin-analysis-text">
                    {result.analysis || "Dựa trên hình ảnh, da bạn đang có dấu hiệu mất cân bằng độ ẩm và xuất hiện các điểm viêm nhẹ. Cần chú trọng bước làm sạch và cấp ẩm phục hồi."}
                  </div>
               </div>

               <div className="skin-products-section">
                  <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '15px' }}>Sản phẩm khuyên dùng</h3>
                  <div className="skin-product-table-wrap">
                    {result.products && result.products.length > 0 ? (
                      <table className="skin-product-table">
                        <tbody>
                          {result.products.map((prod, i) => (
                            <tr key={i} className="product-row">
                              <td className="product-cell image">
                                <img src={prod.image_url} alt={prod.name} />
                              </td>
                              <td className="product-cell info">
                                <div className="product-type">{prod.type}</div>
                                <div className="product-name">{prod.name}</div>
                                <div className="product-usage">{prod.usage}</div>
                              </td>
                              <td className="product-cell action">
                                <button 
                                  className="btn-buy-now" 
                                  onClick={() => this.props.navigate(prod.product_url)}
                                >
                                  Mua ngay
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: '#64748b', fontStyle: 'italic' }}>Chưa có đề xuất sản phẩm cụ thể.</p>
                    )}
                  </div>
               </div>

               {isSevere && (
                 <div className="medical-warning-box">
                    <h4>⚠️ CẢNH BÁO TÌNH TRẠNG NẶNG</h4>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>
                      Tình trạng da của bạn có dấu hiệu viêm nhiễm sâu hoặc tổn thương diện rộng. Bạn nên đến gặp bác sĩ da liễu sớm để được điều trị chuyên môn.
                    </p>
                    <div className="clinic-list">
                       <div className="clinic-item">
                          <div className="clinic-name">Bệnh viện Da liễu TP.HCM</div>
                          <div className="clinic-address">📍 2 Nguyễn Thông, Phường 6, Quận 3, TP.HCM</div>
                          <div className="clinic-desc">Cơ sở y tế đầu ngành về da liễu tại miền Nam.</div>
                       </div>
                       <div className="clinic-item">
                          <div className="clinic-name">Phòng khám Da liễu Sài Gòn (SGC)</div>
                          <div className="clinic-address">📍 35A1 Ba Tháng Hai, Phường 11, Quận 10, TP.HCM</div>
                          <div className="clinic-desc">Chuyên điều trị mụn và phục hồi da chuyên sâu.</div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
          
          <div className="skin-result-footer" style={{ padding: '20px 30px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
             <button className="skin-btn-prod" style={{ maxWidth: '300px' }} onClick={() => this.props.navigate('/home#products')}>XEM TẤT CẢ SẢN PHẨM</button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { mode, analyzing, image, error, showHistory, history, aiStatus, isRealtimeActive } = this.state;

    return (
      <div className="skin-page-container">
        <div className="skin-header-info">
            <span className="ai-badge">{aiStatus}</span>
            <h1>AI SKIN SCANNER</h1>
            <p>Phân tích đa tầng theo thời gian thực</p>
        </div>

        <div className="skin-mode-tabs">
            <button className={mode === 'camera' ? 'active' : ''} onClick={() => this.switchMode('camera')}>📷 CAMERA</button>
            <button className={mode === 'upload' ? 'active' : ''} onClick={() => this.switchMode('upload')}>📂 UPLOAD</button>
            <button className="skin-btn-refresh" onClick={() => window.location.reload()}>🔄 TẢI LẠI TRANG</button>
        </div>

        <div className="skin-scanner-wrap">
          {error && <div className="skin-error" style={{ marginBottom: 15, background: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 10, fontSize: 13 }}>⚠️ {error}</div>}
          
          <div className="skin-video-container">
            {mode === 'camera' ? (
                <>
                    {this.state.isInitializingCamera || this.state.isCameraStarted ? (
                        <>
                            <video ref={this.videoRef} autoPlay playsInline className="skin-video" width="640" height="480" />
                            <canvas ref={this.overlayRef} className="skin-overlay" width="640" height="480" />
                            {isRealtimeActive && !analyzing && <div className="live-indicators">
                                <div className="indicator">SCANNING...</div>
                                <div className="indicator">LANDMARKS: VALID</div>
                            </div>}
                        </>
                    ) : (
                        <div className="camera-placeholder">
                            <span className="icon">📷</span>
                            <h3>Sẵn sàng soi da Camera AI</h3>
                            <button className="skin-btn-start" onClick={this.startAICamera}>BẮT ĐẦU CAMERA</button>
                        </div>
                    )}
                </>
            ) : (
                <div className="skin-upload-area">
                    {image ? (<img src={image} alt="Uploaded" className="skin-preview-img" />) : (
                        <div className="skin-upload-placeholder">
                            <span className="icon">📷</span>
                            <p>Tải ảnh chân dung lên</p>
                            <input type="file" accept="image/*" onChange={this.handleFileUpload} id="fileInput" hidden />
                            <label htmlFor="fileInput" className="skin-btn-file">CHỌN ẢNH</label>
                        </div>
                    )}
                </div>
            )}
            
            {analyzing && (
                <div className="skin-scanning-overlay">
                    <div className="skin-scan-line"></div>
                    <div className="skin-scan-text">Thuật toán AI đang tính toán...</div>
                </div>
            )}
          </div>

          <div className="skin-controls">
            {mode === 'camera' && !image && !analyzing && (
                <button className={`skin-btn-capture ${isRealtimeActive ? '' : 'disabled'}`} onClick={this.captureImage} disabled={!isRealtimeActive}>
                    <div className="skin-btn-inner"></div>
                    {isRealtimeActive ? 'SOI DA NGAY' : 'VUI LÒNG ĐƯA MẶT VÀO KHUNG...'}
                </button>
            )}
            <button className="skin-btn-history" onClick={() => this.setState({ showHistory: !this.state.showHistory })}>
                {showHistory ? 'ĐÓNG LỊCH SỬ' : 'LỊCH SỬ SOI DA'}
            </button>
          </div>
        </div>

        {showHistory && (
            <div className="skin-history-list ab-visible">
                <div className="skin-history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ margin: 0 }}>Kết quả những lần trước</h3>
                    {history.length > 0 && (
                        <button onClick={this.apiDeleteAllHistory} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 15px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                           🗑 XÓA TẤT CẢ
                        </button>
                    )}
                </div>
                {history.length === 0 ? <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>Chưa có lịch sử.</p> : (
                    <div className="skin-history-grid">
                        {history.map(item => (
                            <div key={item._id} className="skin-history-card" style={{ position: 'relative' }}>
                                <button 
                                   onClick={() => this.apiDeleteHistoryItem(item._id)}
                                   style={{ position: 'absolute', top: 5, right: 5, zIndex: 10, background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', color: '#ef4444' }}
                                >✕</button>
                                <img src={item.image} alt="History" />
                                <div className="skin-history-info">
                                    <div className="date">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                                    <div className="type" style={{ color: '#374d29', fontWeight: 'bold' }}>{item.skinType}</div>
                                    <div className="mini-scores" style={{ fontSize: 10, display: 'flex', gap: 5, marginTop: 5 }}>
                                        <span style={{ background: '#f0f0f0', padding: '2px 5px', borderRadius: 4 }}>Mụn: {Math.round(100 - (item.concerns?.acne || 0))}%</span>
                                        <span style={{ background: '#f0f0f0', padding: '2px 5px', borderRadius: 4 }}>Mịn: {Math.round(100 - (item.concerns?.texture || 0))}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        <canvas ref={this.canvasRef} style={{ display: 'none' }} />
        {this.renderResult()}
      </div>
    );
  }
}

export default withRouter(SkinAnalysis);
