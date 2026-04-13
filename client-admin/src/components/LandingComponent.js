import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class LandingComponent extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      hero: null,
      selectedFile: null,
      uploading: false,
      message: ''
    };
  }

  componentDidMount() {
    this.apiGetHero();
  }

  apiGetHero() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/hero', config).then((res) => {
      this.setState({ hero: res.data });
    }).catch((err) => {
      console.error(err);
    });
  }

  handleFileChange = (e) => {
    this.setState({ selectedFile: e.target.files[0] });
  };

  apiUploadVideo = () => {
    if (!this.state.selectedFile) {
        alert("Vui lòng chọn video trước khi upload.");
        return;
    }

    this.setState({ uploading: true, message: '' });
    const formData = new FormData();
    formData.append('video', this.state.selectedFile);

    const config = {
      headers: {
        'x-access-token': this.context.token,
        'Content-Type': 'multipart/form-data'
      }
    };

    axios.post('/api/admin/hero/upload', formData, config)
      .then((res) => {
        this.setState({ uploading: false });
        if (res.data.success) {
          alert('Upload video thành công!');
          this.apiGetHero(); // Refresh hero data
        } else {
          alert('Upload thất bại: ' + res.data.message);
        }
      })
      .catch((err) => {
        this.setState({ uploading: false });
        console.error(err);
        alert('Có lỗi xảy ra khi upload.');
      });
  };

  render() {
    const hero = this.state.hero;
    const videoSrc = hero?.video || '';

    return (
      <div className="inner-responsive" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: '#374d29', marginBottom: '30px', textTransform: 'uppercase' }}>
            QUẢN LÝ VIDEO TRANG CHỦ (HERO)
        </h2>

        <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '30px' }}>
                <h4 style={{ marginBottom: '15px', color: '#374d29' }}>Video hiện tại (Tỉ lệ 16:9):</h4>
                {videoSrc ? (
                    <div style={{ 
                        width: '100%', 
                        aspectRatio: '16/9', 
                        background: '#000', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
                    }}>
                        <video src={videoSrc} controls autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                ) : (
                    <div style={{ 
                        width: '100%', 
                        aspectRatio: '16/9', 
                        background: '#f3f4f6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#6b7280',
                        borderRadius: '12px',
                        border: '2px dashed #d1d5db'
                    }}>
                        Chưa có video. Đang hiển thị ảnh mặc định trên website.
                    </div>
                )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

            <div>
                <h4 style={{ marginBottom: '10px', color: '#374d29' }}>Tải video mới lên:</h4>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                    * Video nên có tỉ lệ 16:9 (ngang) và dung lượng tối đa 100MB để đảm bảo trải nghiệm tốt nhất.
                </p>
                
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                        type="file" 
                        accept="video/*" 
                        onChange={this.handleFileChange}
                        style={{ 
                            padding: '10px', 
                            border: '1px solid #ddd', 
                            borderRadius: '8px', 
                            background: '#f9fafb',
                            flex: '1',
                            minWidth: '250px'
                        }} 
                    />
                    <button 
                        onClick={this.apiUploadVideo} 
                        disabled={this.state.uploading || !this.state.selectedFile}
                        style={{ 
                            padding: '12px 25px', 
                            background: (this.state.uploading || !this.state.selectedFile) ? '#9ca3af' : '#374d29', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: 'bold',
                            cursor: (this.state.uploading || !this.state.selectedFile) ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {this.state.uploading ? 'ĐANG UPLOAD...' : 'BẮT ĐẦU UPLOAD'}
                    </button>
                </div>
                {this.state.message && <p style={{ marginTop: '15px', color: 'green', fontWeight: 'bold' }}>{this.state.message}</p>}
            </div>
        </div>

        <div style={{ marginTop: '40px', padding: '20px', background: '#f0eed9', borderRadius: '12px', border: '1px solid #dcd6b6' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#374d29' }}>💡 Mẹo:</h5>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#4b5e43', lineHeight: '1.6' }}>
                <li>Sử dụng video có độ phân giải 1080p hoặc 720p tỉ lệ 16:9.</li>
                <li>Video nên được nén tốt để tải nhanh hơn cho khách hàng.</li>
                <li>Phần Hero Video này được thiết kế tự động phát (autoplay) và tắt tiếng (muted) trên trang chủ.</li>
            </ul>
        </div>
      </div>
    );
  }
}

export default LandingComponent;
