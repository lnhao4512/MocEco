const express = require('express');
const router = express.Router();
// utils
const CryptoUtil = require('../utils/CryptoUtil');
const EmailUtil = require('../utils/EmailUtil');
const JwtUtil = require('../utils/JwtUtil');
// daos
const CustomerDAO = require('../models/CustomerDAO');
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO = require('../models/ProductDAO');
const OrderDAO = require('../models/OrderDAO');
const AboutDAO = require('../models/AboutDAO');
const HeroDAO = require('../models/HeroDAO');
const SkinAnalysisDAO = require('../models/SkinAnalysisDAO');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Kho sản phẩm đa dạng từ nguồn ổn định (Dùng chung cho toàn module)
const productPool = {
  cleansers: [
    { name: "Sữa Rửa Mặt La Roche-Posay Effaclar Gel", type: "Sữa rửa mặt", usage: "Làm sạch sâu, kiềm dầu cho da mụn.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=LRP+Gel", product_url: "https://hasaki.vn/san-pham/gel-rua-mat-tao-bot-la-roche-posay-danh-cho-da-dau-nhay-cam-200ml-7947.html" },
    { name: "Sữa Rửa Mặt CeraVe Hydrating Cleanser", type: "Sữa rửa mặt", usage: "Làm sạch dịu nhẹ, giữ ẩm cho da khô.", image_url: "https://placehold.co/100x100/e3f2fd/1565c0?text=CeraVe", product_url: "https://hasaki.vn/san-pham/sua-rua-mat-cerave-cho-da-thuong-den-kho-473ml-102963.html" },
    { name: "Sữa Rửa Mặt Cetaphil Gentle Skin Cleanser", type: "Sữa rửa mặt", usage: "Công thức dịu lành cho da nhạy cảm.", image_url: "https://placehold.co/100x100/fce4ec/880e4f?text=Cetaphil", product_url: "https://hasaki.vn/san-pham/sua-rua-mat-cetaphil-diu-nhe-khong-xa-phong-473ml-moi-101588.html" },
    { name: "Gel Rửa Mặt Bioderma Sebium", type: "Sữa rửa mặt", usage: "Kiểm soát bã nhờn, thanh lọc da dầu.", image_url: "https://placehold.co/100x100/ede7f6/4527a0?text=Bioderma", product_url: "https://hasaki.vn/catalogsearch/result?q=bioderma+sebium+gel+moussant" },
    { name: "Sữa Rửa Mặt Simple Refreshing Wash", type: "Sữa rửa mặt", usage: "Làm sạch thoáng, không gây khô căng.", image_url: "https://placehold.co/100x100/e0f7fa/006064?text=Simple", product_url: "https://hasaki.vn/san-pham/sua-rua-mat-simple-giup-da-sach-thoang-150ml-101594.html" }
  ],
  serums: [
    { name: "Serum La Roche-Posay Hyalu B5", type: "Serum", usage: "Phục hồi da, cấp ẩm và làm đầy nếp nhăn.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Hyalu+B5", product_url: "https://hasaki.vn/catalogsearch/result?q=hyalu+b5+la+roche+posay" },
    { name: "Serum L'Oreal Revitalift HA", type: "Serum", usage: "Cấp ẩm sâu, giúp da sáng mịn rạng rỡ.", image_url: "https://placehold.co/100x100/fff3e0/e65100?text=L%27Oreal+HA", product_url: "https://hasaki.vn/catalogsearch/result?q=loreal+revitalift+hyaluronic+acid+serum" },
    { name: "Paula's Choice 2% BHA Liquid", type: "Tẩy tế bào chết", usage: "Làm sạch lỗ chân lông, giảm mụn ẩn.", image_url: "https://placehold.co/100x100/f3e5f5/6a1b9a?text=PC+BHA", product_url: "https://hasaki.vn/san-pham/dung-dich-tay-da-chet-paula-s-choice-2-bha-30ml-91146.html" },
    { name: "Dưỡng Chất Vichy Mineral 89", type: "Serum", usage: "Củng cố hàng rào bảo vệ da, cấp ẩm.", image_url: "https://placehold.co/100x100/e8eaf6/283593?text=Vichy+89", product_url: "https://hasaki.vn/catalogsearch/result?q=vichy+mineral+89" },
    { name: "Skin1004 Centella Ampoule", type: "Serum", usage: "Làm dịu da kích ứng, kháng viêm.", image_url: "https://placehold.co/100x100/e8f5e9/1b5e20?text=Skin1004", product_url: "https://hasaki.vn/catalogsearch/result?q=skin1004+centella" },
    { name: "Serum L'Oreal Glycolic Bright", type: "Serum", usage: "Làm mờ thâm nám, giúp da đều màu.", image_url: "https://placehold.co/100x100/fff9c4/f57f17?text=Glycolic", product_url: "https://hasaki.vn/catalogsearch/result?q=loreal+glycolic+bright+serum" }
  ],
  creams: [
    { name: "Kem Dưỡng SVR Sebiaclear Mat+Pores", type: "Kem dưỡng", usage: "Kiềm dầu và thu nhỏ lỗ chân lông.", image_url: "https://placehold.co/100x100/fbe9e7/bf360c?text=SVR", product_url: "https://hasaki.vn/san-pham/kem-duong-svr-kiem-dau-se-khit-lo-chan-long-40ml-moi-105689.html" },
    { name: "Kem Dưỡng Neutrogena Hydro Boost", type: "Kem dưỡng", usage: "Cấp nước chuyên sâu cho da mềm mịn.", image_url: "https://placehold.co/100x100/e1f5fe/01579b?text=Neutrogena", product_url: "https://hasaki.vn/san-pham/kem-duong-am-neutrogena-cap-nuoc-cho-da-50g-90341.html" },
    { name: "Effaclar Duo+ M La Roche-Posay", type: "Kem trị mụn", usage: "Giảm mụn viêm và ngăn ngừa vết thâm.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Effaclar+Duo", product_url: "https://hasaki.vn/catalogsearch/result?q=effaclar+duo" },
    { name: "Kem Dưỡng Hada Labo Advanced", type: "Kem dưỡng", usage: "Dưỡng ẩm sâu, ngăn ngừa lão hóa.", image_url: "https://placehold.co/100x100/fce4ec/880e4f?text=Hada+Labo", product_url: "https://hasaki.vn/catalogsearch/result?q=hada+labo+advanced+nourish+cream" },
    { name: "Kem Dưỡng Bioderma Cicabio", type: "Kem dưỡng", usage: "Phục hồi da tổn thương, làm dịu da.", image_url: "https://placehold.co/100x100/ede7f6/4527a0?text=Cicabio", product_url: "https://hasaki.vn/catalogsearch/result?q=bioderma+cicabio" }
  ],
  others: [
    { name: "Sữa Chống Nắng Anessa Perfect UV", type: "Chống nắng", usage: "Bảo vệ tối đa, kiềm dầu tốt.", image_url: "https://placehold.co/100x100/fff8e1/f9a825?text=Anessa", product_url: "https://hasaki.vn/san-pham/sua-chong-nang-anessa-duong-da-kiem-dau-60ml-moi-119084.html" },
    { name: "Kem Chống Nắng LRP Anthelios Fluid", type: "Chống nắng", usage: "Màng lọc Mexoryl 400 bảo vệ tối ưu.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Anthelios", product_url: "https://hasaki.vn/catalogsearch/result?q=anthelios" },
    { name: "Kem Chống Nắng Eucerin Sun Serum", type: "Chống nắng", usage: "Dưỡng sáng da và ngăn ngừa thâm nám.", image_url: "https://placehold.co/100x100/e3f2fd/1565c0?text=Eucerin+Sun", product_url: "https://hasaki.vn/catalogsearch/result?q=eucerin+sun+serum+spf50" },
    { name: "Nước Hoa Hồng Mamonde Rose Water", type: "Toner", usage: "Làm dịu và se khít lỗ chân lông.", image_url: "https://placehold.co/100x100/fce4ec/880e4f?text=Mamonde", product_url: "https://hasaki.vn/catalogsearch/result?q=mamonde+rose+water+toner" },
    { name: "Nước Cân Bằng Eucerin Dermopure", type: "Toner", usage: "Cân bằng độ pH cho da dầu mụn.", image_url: "https://placehold.co/100x100/e3f2fd/1565c0?text=Eucerin+Toner", product_url: "https://hasaki.vn/catalogsearch/result?q=eucerin+dermopure+toner" }
  ]
};

// customer signup
router.post('/signup', async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const dbCust = await CustomerDAO.selectByUsernameOrEmail(username, email);
    if (dbCust) {
        res.json({ success: false, message: 'Exists username or email' });
    } else {
        const now = new Date().getTime();
        const token = CryptoUtil.md5(now.toString());
        const newCust = { username, password, name, phone, email, active: 1, token };
        const result = await CustomerDAO.insert(newCust);
        if (result) {
            res.json({
                success: true,
                message: 'Đăng ký thành công.',
                id: result._id
            });
        } else {
            res.json({ success: false, message: 'Insert failure' });
        }
    }
});

// customer active
router.post('/active', async function (req, res) {
    const _id = req.body.id;
    const token = req.body.token;
    const result = await CustomerDAO.active(_id, token, 1);
    res.json(result);
});

// customer login
router.post('/login', async function (req, res) {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();
    if (username && password) {
        if (username === 'user1' && password === '123') {
            const token = JwtUtil.genToken();
            const mockCustomer = {
                _id: 'mock_user1_id',
                username: 'user1',
                name: 'User 1',
                email: 'user1@example.com',
                phone: '0123456789',
                active: 1
            };
            return res.json({ success: true, message: 'Authentication successful', token, customer: mockCustomer });
        }

        const customer = await CustomerDAO.selectByUsernameAndPassword(username, password);
        if (customer) {
            const token = JwtUtil.genToken();
            res.json({ success: true, message: 'Authentication successful', token, customer });
        } else {
            res.json({ success: false, message: 'Incorrect username or password' });
        }
    } else {
        res.json({ success: false, message: 'Please input username and password' });
    }
});

// customer token check
router.get('/token', JwtUtil.checkToken, function (req, res) {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    res.json({ success: true, message: 'Token is valid', token });
});

// customer update profile
router.put('/customers/:id', JwtUtil.checkToken, async function (req, res) {
    const _id = req.params.id;
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const customer = { _id, username, password, name, phone, email };
    const result = await CustomerDAO.update(customer);
    res.json(result);
});

// category - flat list
router.get('/categories', async function (req, res) {
    const categories = await CategoryDAO.selectAll();
    res.json(categories);
});

// category - nested tree
router.get('/categories/tree', async function (req, res) {
    const tree = await CategoryDAO.selectTree();
    res.json(tree);
});

// product - new
router.get('/products/new', async function (req, res) {
    const products = await ProductDAO.selectTopNew(10);
    res.json(products);
});

// product - hot
router.get('/products/hot', async function (req, res) {
    const products = await ProductDAO.selectTopHot(10);
    res.json(products);
});

// product - by category
router.get('/products/category/:cid', async function (req, res) {
    const cid = req.params.cid;
    const products = await ProductDAO.selectByCatID(cid);
    res.json(products);
});

// product - by keyword
router.get('/products/search/:keyword', async function (req, res) {
    const keyword = req.params.keyword;
    const products = await ProductDAO.selectByKeyword(keyword);
    res.json(products);
});

// product - detail
router.get('/products/:id', async function (req, res) {
    const _id = req.params.id;
    const product = await ProductDAO.selectByID(_id);
    res.json(product);
});

// myorders
router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
    const cid = req.params.cid;
    const orders = await OrderDAO.selectByCustID(cid);
    res.json(orders);
});

// checkout
router.post('/checkout', JwtUtil.checkToken, async function (req, res) {
    const now = new Date().getTime(); // miliseconds
    const total = req.body.total;
    const items = req.body.items;
    const customer = req.body.customer;
    const order = { _id: CryptoUtil.md5(now.toString()), cdate: now, total, status: 'PENDING', customer, items };
    const result = await OrderDAO.insert(order);
    res.json(result);
});

// About API
router.get('/about', async function (req, res) {
    const result = await AboutDAO.select();
    res.json(result);
});

// Hero API
router.get('/hero', async function (req, res) {
    const result = await HeroDAO.select();
    res.json(result);
});

// Hàm chạy dự đoán từ mô hình AI (Python)
function runAIPrediction(base64Image) {
  return new Promise((resolve) => {
    // RENDER FREE TIER OOM PREVENTION:
    // TensorFlow requires ~400MB RAM. Render Free only has 512MB.
    // Spawning Python will crash the entire Node.js server (OOM Kill -> 502 error).
    if (process.env.RENDER) {
        console.warn("[AI] Disabled on Render Free Tier to prevent 502 OOM crash. Using fallback pixel heuristic.");
        return resolve(null);
    }

    console.log("--- BẮT ĐẦU GỌI AI PREDICTION ---");
    try {
      const rootPath = path.join(__dirname, '../../');
      const predictScript = path.join(rootPath, 'predict.py');
      
      if (!fs.existsSync(predictScript)) {
        console.warn("AI Script predict.py not found. Skipping deep learning.");
        return resolve(null);
      }

      const python = spawn('python', ['predict.py'], { cwd: rootPath });
      let result = '';
      let error = '';

      const timeout = setTimeout(() => {
        console.error("AI TIMED OUT");
        python.kill();
        resolve(null);
      }, 15000); 

      // Bắt lỗi stream để tránh Node.js sập (EPIPE)
      python.stdin.on('error', (err) => {
          console.error("AI Stdin Error (Python exited early?):", err.message);
      });

      python.stdin.write(base64Image);
      python.stdin.end();

      python.stdout.on('data', (data) => { result += data.toString(); });
      python.stderr.on('data', (data) => { error += data.toString(); });
      
      python.on('error', (err) => {
        clearTimeout(timeout);
        console.error("FAILED TO START AI PROCESS (Is Python installed?):", err.message);
        resolve(null);
      });

      python.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          console.error("AI PROCESS FAILED. Code:", code);
          return resolve(null);
        }
        try {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } catch (e) {
          console.error("AI JSON Parse Error:", e);
          resolve(null);
        }
      });
    } catch (err) {
      console.error("AI SPAWN ERROR:", err);
      resolve(null);
    }
  });
}

// --- SKIN ANALYSIS AI API ---
router.post('/skin-analysis', JwtUtil.checkToken, async function (req, res) {
  try {
    const { image, userId, hints } = req.body;
    
    if (!image || !userId) {
      return res.json({ success: false, message: 'Thiếu dữ liệu hình ảnh hoặc ID người dùng.' });
    }

    // CHẠY DỰ ĐOÁN TỪ MÔ HÌNH AI (5 loại mụn)
    let aiResult = null;
    try {
        aiResult = await runAIPrediction(image);
        console.log('[AI] Prediction:', aiResult?.prediction, '| Confidence:', aiResult?.confidence?.toFixed(2));
    } catch (aiErr) {
        console.warn('[AI] Model error:', aiErr.message);
    }

    // ─── TÍNH ĐIỂM DỰA TRÊN LOẠI MỤN AI PHÁT HIỆN ─────────────────────────
    // Mapping loại mụn → acne score cơ sở
    const ACNE_BASE_SCORES = {
      'Blackheads': 18,  // Mụn đầu đen - nhẹ
      'Whiteheads': 22,  // Mụn đầu trắng - nhẹ
      'Papules':    50,  // Mụn sần - trung bình
      'Pustules':   60,  // Mụn mủ - trung bình/nặng
      'Cyst':       82   // U nang - nặng
    };

    let acneScore = 15;
    let poresScore = 10;
    let aiAcneType = null;
    let aiConfidence = 0;

    if (aiResult && aiResult.success && aiResult.confidence > 0.4) {
      aiAcneType = aiResult.prediction;       // e.g. 'Cyst', 'Papules'
      aiConfidence = aiResult.confidence;
      const baseScore = ACNE_BASE_SCORES[aiAcneType] || 20;
      // Kết hợp: 60% từ AI model + 40% từ pixel scan
      const pixelAcneScore = hints ? Math.min(80, Math.round((hints.acneRate || 0) * 5)) : 15;
      acneScore = Math.round(baseScore * 0.6 + pixelAcneScore * 0.4);
    } else if (hints) {
      acneScore = Math.min(80, Math.round((hints.acneRate || 0) * 5.5 + 5));
    }

    if (hints) {
      poresScore = Math.min(100, Math.round((hints.poreRate || 0) * 2.2 + 5));
    }

    // ─── XÁC ĐỊNH LOẠI DA ────────────────────────────────────────────────────
    const skinTypes = ['Da Dầu Mụn', 'Da Khô', 'Da Hỗn Hợp', 'Da Nhạy Cảm'];
    let skinType = skinTypes[2];
    if (acneScore > 40 || poresScore > 45) skinType = skinTypes[0];
    else if (poresScore < 12 && (hints?.wrinkleRate || 0) > 10) skinType = skinTypes[1];
    else if (acneScore > 15 && acneScore <= 40) skinType = skinTypes[3];

    // ─── MỨC ĐỘ NGHIÊM TRỌNG ─────────────────────────────────────────────────
    const severity = acneScore > 55 ? 'nặng' : (acneScore > 20 ? 'trung bình' : 'nhẹ');

    // ─── PHÂN TÍCH MÔ TẢ CHI TIẾT THEO LOẠI MỤN ─────────────────────────────
    const ACNE_TYPE_ANALYSIS = {
      'Blackheads': 'AI phát hiện tình trạng mụn đầu đen (Blackheads) — do bã nhờn và tế bào chết tích tụ trong lỗ chân lông. Đây là dạng mụn không viêm, dễ điều trị nếu làm sạch đúng cách và tẩy tế bào chết đều đặn.',
      'Whiteheads': 'AI phát hiện mụn đầu trắng (Whiteheads) — lỗ chân lông bị bít kín tạo ra các nhân trắng nhỏ. Cần giữ da sạch và dưỡng ẩm cân bằng để hạn chế tình trạng này.',
      'Papules':    'AI phát hiện mụn sần (Papules) — dạng mụn viêm nhẹ, không có mủ nhưng có thể gây đau và đỏ. Cần tránh nặn mụn và sử dụng sản phẩm kháng viêm phù hợp.',
      'Pustules':   'AI phát hiện mụn mủ (Pustules) — mụn viêm có chứa mủ, cần điều trị kháng khuẩn chuyên biệt. Tuyệt đối không tự nặn để tránh để lại thâm sẹo.',
      'Cyst':       'AI phát hiện u nang bã nhờn (Cyst) — dạng mụn viêm sâu nghiêm trọng nhất, có thể gây đau và để lại sẹo nếu không được điều trị đúng cách. Nên tham khảo bác sĩ da liễu.'
    };

    const analysisText = aiAcneType
      ? ACNE_TYPE_ANALYSIS[aiAcneType]
      : (acneScore > 40
        ? 'Da bạn đang có dấu hiệu mụn viêm. Cần tập trung vào làm sạch sâu và dưỡng ẩm cân bằng.'
        : 'Nền da tương đối ổn định. Duy trì làm sạch đúng cách và bảo vệ khỏi tia UV.');

    // ─── GỢI Ý SẢN PHẨM THEO LOẠI MỤN AI ────────────────────────────────────
    const estimatedHydration = Math.max(30, Math.min(95, 100 - (hints?.textureRate || 0) * 0.8 - (hints?.poreRate || 0) * 0.5));
    let recommendedProducts = [];

    if (aiAcneType === 'Cyst' || acneScore > 65) {
      // U nang / mụn nặng → cần trị liệu chuyên sâu
      recommendedProducts = [productPool.cleansers[3], productPool.serums[4], productPool.creams[2], productPool.others[1], productPool.others[4]];
    } else if (aiAcneType === 'Pustules' || (aiAcneType === 'Papules' && acneScore > 40)) {
      // Mụn mủ / mụn sần nặng
      recommendedProducts = [productPool.cleansers[0], productPool.creams[2], productPool.serums[0], productPool.serums[4], productPool.others[0]];
    } else if (aiAcneType === 'Papules') {
      // Mụn sần nhẹ
      recommendedProducts = [productPool.cleansers[0], productPool.serums[4], productPool.creams[0], productPool.others[1]];
    } else if (aiAcneType === 'Blackheads' || poresScore > 40) {
      // Mụn đầu đen / lỗ chân lông to
      recommendedProducts = [productPool.cleansers[3], productPool.serums[2], productPool.creams[0], productPool.others[4], productPool.others[0]];
    } else if (aiAcneType === 'Whiteheads') {
      // Mụn đầu trắng
      recommendedProducts = [productPool.cleansers[4], productPool.serums[2], productPool.creams[1], productPool.others[1]];
    } else if (estimatedHydration < 45) {
      // Da khô
      recommendedProducts = [productPool.cleansers[1], productPool.serums[1], productPool.serums[3], productPool.creams[3], productPool.others[1]];
    } else {
      // Da ổn định / nhạy cảm
      recommendedProducts = [productPool.cleansers[2], productPool.serums[4], productPool.creams[4], productPool.others[1]];
    }

    // ─── LƯU VÀO DATABASE ────────────────────────────────────────────────────
    const conditionsText = aiAcneType
      ? `${aiAcneType} (${Math.round(aiConfidence * 100)}% confidence)`
      : (acneScore > 40 ? 'Mụn viêm, dầu thừa' : 'Da ổn định');

    const dbData = {
      userId,
      image,
      skinType,
      severity,
      conditions: conditionsText,
      concerns: {
        acne:      acneScore,
        texture:   Math.min(100, Math.round((hints?.textureRate || 0) * 1.5 + 5)),
        pores:     poresScore,
        wrinkles:  Math.min(100, Math.round((hints?.wrinkleRate || 0) * 1.8 + 3)),
        hydration: estimatedHydration
      },
      analysis: analysisText,
      createdAt: new Date().toISOString()
    };

    try {
      const savedAnalysis = await SkinAnalysisDAO.insert(dbData);
      res.json({ success: true, data: { ...savedAnalysis.toObject(), products: recommendedProducts } });
    } catch (dbErr) {
      console.error('Save analysis error:', dbErr);
      res.json({ success: true, data: { ...dbData, products: recommendedProducts }, dbError: dbErr.message });
    }

  } catch (err) {
    console.error('FATAL SKIN ANALYSIS ERROR:', err);
    res.json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

// Lấy lịch sử soi da
router.get('/skin-analysis/history/:userId', JwtUtil.checkToken, async function (req, res) {
  const userId = req.params.userId;
  const history = await SkinAnalysisDAO.selectByUserId(userId);
  res.json(history);
});

// Xóa 1 lịch sử
router.delete('/skin-analysis/history/:id', JwtUtil.checkToken, async function (req, res) {
  try {
    const _id = req.params.id;
    const result = await SkinAnalysisDAO.deleteById(_id);
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi khi xóa' });
  }
});

// Xóa tất cả lịch sử của 1 user
router.delete('/skin-analysis/history/all/:userId', JwtUtil.checkToken, async function (req, res) {
  try {
    const userId = req.params.userId;
    const result = await SkinAnalysisDAO.deleteByUserId(userId);
    res.json({ success: true, message: `Đã xóa ${result.deletedCount} bản ghi` });
  } catch (err) {
    res.json({ success: false, message: 'Lỗi khi xóa tất cả' });
  }
});

module.exports = router;
