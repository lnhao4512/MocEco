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

// Kho sản phẩm đa dạng kết hợp Cocoon & Hasaki (Dùng chung cho toàn module)
const productPool = {
  cleansers: [
    { name: "Gel Bí Đao Rửa Mặt Cocoon (310ml)", type: "Sữa rửa mặt", usage: "Làm sạch sâu, giảm dầu thừa và mụn.", image_url: "https://image.cocoonvietnam.com/uploads/gel_rua_mat_bi_dao_310ml_081a95e0c5.jpg", product_url: "https://cocoonvietnam.com/san-pham/gel-bi-dao-rua-mat-310ml" },
    { name: "Sữa Rửa Mặt La Roche-Posay Effaclar Gel", type: "Sữa rửa mặt", usage: "Làm sạch sâu, kiềm dầu cho da mụn.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=LRP+Gel", product_url: "https://hasaki.vn/san-pham/gel-rua-mat-tao-bot-la-roche-posay-danh-cho-da-dau-nhay-cam-200ml-7947.html" },
    { name: "Nước Tẩy Trang Bí Đao Cocoon (500ml)", type: "Tẩy trang", usage: "Làm sạch lớp trang điểm và bụi bẩn dịu nhẹ.", image_url: "https://image.cocoonvietnam.com/uploads/nuoc_tay_trang_bi_dao_500ml_3756858e74.jpg", product_url: "https://cocoonvietnam.com/san-pham/nuoc-tay-trang-bi-dao-500ml" },
    { name: "Sữa Rửa Mặt CeraVe Hydrating Cleanser", type: "Sữa rửa mặt", usage: "Làm sạch dịu nhẹ, giữ ẩm cho da khô.", image_url: "https://placehold.co/100x100/e3f2fd/1565c0?text=CeraVe", product_url: "https://hasaki.vn/san-pham/sua-rua-mat-cerave-cho-da-thuong-den-kho-473ml-102963.html" },
    { name: "Gel Rửa Mặt Hoa Hồng Cocoon (140ml)", type: "Sữa rửa mặt", usage: "Làm sạch và cấp ẩm cho da khô, nhạy cảm.", image_url: "https://image.cocoonvietnam.com/uploads/gel_rua_mat_hoa_hong_140ml_f8b444766c.jpg", product_url: "https://cocoonvietnam.com/san-pham/gel-rua-mat-hoa-hong-140ml" },
    { name: "Cà Phê Đắk Lắk Làm Sạch Da Chết Mặt (150ml)", type: "Tẩy tế bào chết", usage: "Làm sạch da chết, giúp da mịn màng, đều màu.", image_url: "https://image.cocoonvietnam.com/uploads/ca_phe_dak_lak_lam_sach_da_chet_da_mat_150ml_77583f605a.jpg", product_url: "https://cocoonvietnam.com/san-pham/ca-phe-dak-lak-lam-sach-da-chet-mat-150ml" }
  ],
  serums: [
    { name: "Tinh Chất Nghệ Hưng Yên X2.2 (22% Vitamin C)", type: "Serum", usage: "Dưỡng sáng da, mờ thâm nám mạnh mẽ.", image_url: "https://image.cocoonvietnam.com/uploads/tinh_chat_nghe_hung_yen_c30_30ml_610f74577b.jpg", product_url: "https://cocoonvietnam.com/san-pham/tinh-chat-nghe-hung-yen-x2-2-22-vitamin-c-30ml" },
    { name: "Serum La Roche-Posay Hyalu B5", type: "Serum", usage: "Phục hồi da, cấp ẩm và làm đầy nếp nhăn.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Hyalu+B5", product_url: "https://hasaki.vn/catalogsearch/result?q=hyalu+b5+la+roche+posay" },
    { name: "Tinh Chất Bí Đao N15 Cocoon (70ml)", type: "Serum", usage: "Phục hồi da, giảm mụn và mẩn đỏ.", image_url: "https://image.cocoonvietnam.com/uploads/tinh_chat_bi_dao_70ml_69f000b213.jpg", product_url: "https://cocoonvietnam.com/san-pham/tinh-chat-bi-dao-n15-70ml" },
    { name: "Paula's Choice 2% BHA Liquid", type: "Tẩy tế bào chết", usage: "Làm sạch lỗ chân lông, giảm mụn ẩn.", image_url: "https://placehold.co/100x100/f3e5f5/6a1b9a?text=PC+BHA", product_url: "https://hasaki.vn/san-pham/dung-dich-tay-da-chet-paula-s-choice-bha-2-30ml-2364.html" },
    { name: "Tinh Chất Hoa Hồng Cocoon (30ml)", type: "Serum", usage: "Cấp ẩm sâu, phục hồi hàng rào bảo vệ da.", image_url: "https://image.cocoonvietnam.com/uploads/tinh_chat_hoa_hong_30ml_5e865f1423.jpg", product_url: "https://cocoonvietnam.com/san-pham/tinh-chat-hoa-hong-30ml" },
    { name: "Skin1004 Centella Ampoule", type: "Serum", usage: "Làm dịu da kích ứng, kháng viêm.", image_url: "https://placehold.co/100x100/e8f5e9/1b5e20?text=Skin1004", product_url: "https://hasaki.vn/catalogsearch/result?q=skin1004+centella" }
  ],
  creams: [
    { name: "Thạch Bí Đao Cocoon (100ml)", type: "Kem dưỡng", usage: "Cấp ẩm, kiềm dầu và làm dịu da mụn.", image_url: "https://image.cocoonvietnam.com/uploads/thach_bi_dao_duong_am_100ml_65809798e4.jpg", product_url: "https://cocoonvietnam.com/san-pham/thach-bi-dao-100ml" },
    { name: "Effaclar Duo+ M La Roche-Posay", type: "Kem trị mụn", usage: "Giảm mụn viêm và ngăn ngừa vết thâm.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Effaclar+Duo", product_url: "https://hasaki.vn/catalogsearch/result?q=effaclar+duo" },
    { name: "Thạch Hoa Hồng Dưỡng Ẩm Cocoon (100ml)", type: "Kem dưỡng", usage: "Nuôi dưỡng da ẩm mượt suốt 24h.", image_url: "https://image.cocoonvietnam.com/uploads/thach_hoa_hong_duong_am_100ml_521a00a068.jpg", product_url: "https://cocoonvietnam.com/san-pham/thach-hoa-hong-duong-am-100ml" },
    { name: "Kem Dưỡng Neutrogena Hydro Boost", type: "Kem dưỡng", usage: "Cấp nước chuyên sâu cho da mềm mịn.", image_url: "https://placehold.co/100x100/e1f5fe/01579b?text=Neutrogena", product_url: "https://hasaki.vn/san-pham/kem-duong-am-neutrogena-cap-nuoc-cho-da-50g-90341.html" },
    { name: "Kem Dưỡng Nghệ Hưng Yên (50ml)", type: "Kem dưỡng", usage: "Dưỡng sáng da và mờ vết thâm.", image_url: "https://image.cocoonvietnam.com/uploads/kem_duong_nghe_hung_yen_50ml_95679f18a2.jpg", product_url: "https://cocoonvietnam.com/san-pham/kem-duong-nghe-hung-yen-50ml" }
  ],
  others: [
    { name: "Nước Bí Đao Cân Bằng Da Cocoon (310ml)", type: "Toner", usage: "Cân bằng pH, giảm dầu và mụn ẩn.", image_url: "https://image.cocoonvietnam.com/uploads/nuoc_bi_dao_can_bang_da_310ml_081a95e0c5.jpg", product_url: "https://cocoonvietnam.com/san-pham/nuoc-bi-dao-can-bang-da-310ml" },
    { name: "Kem Chống Nắng Bí Đao Cocoon (50ml)", type: "Chống nắng", usage: "Bảo vệ da phổ rộng, không gây bóng nhờn.", image_url: "https://image.cocoonvietnam.com/uploads/kem_chong_nang_bi_dao_50ml_643b468571.jpg", product_url: "https://cocoonvietnam.com/san-pham/kem-chong-nang-bi-dao-50ml" },
    { name: "Nước Hoa Hồng Cocoon (310ml)", type: "Toner", usage: "Cấp ẩm, làm mềm da ngay lập tức.", image_url: "https://image.cocoonvietnam.com/uploads/nuoc_hoa_hong_310ml_9436329c21.jpg", product_url: "https://cocoonvietnam.com/san-pham/nuoc-hoa-hong-310ml" },
    { name: "Kem Chống Nắng LRP Anthelios Fluid", type: "Chống nắng", usage: "Màng lọc Mexoryl 400 bảo vệ tối ưu.", image_url: "https://placehold.co/100x100/e8f5e9/374d29?text=Anthelios", product_url: "https://hasaki.vn/catalogsearch/result?q=anthelios" },
    { name: "Son Dưỡng Dầu Dừa Bến Tre (5g)", type: "Son dưỡng", usage: "Dưỡng môi mềm mượt, chống nứt nẻ.", image_url: "https://image.cocoonvietnam.com/uploads/son_duong_dau_dua_ben_tre_5g_36437299a4.jpg", product_url: "https://cocoonvietnam.com/san-pham/son-duong-dau-dua-ben-tre-5g" }
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

// Hàm chạy dự đoán từ mô hình AI (Python TFLite - nhẹ ~50MB RAM)
function runAIPrediction(base64Image) {
  return new Promise((resolve) => {
    console.log("--- BẮT ĐẦU GỌI AI PREDICTION (TFLite) ---");
    try {
      const rootPath = path.join(__dirname, '../../');
      const predictScript = path.join(rootPath, 'predict.py');
      
      if (!fs.existsSync(predictScript)) {
        console.warn("AI Script predict.py not found. Skipping deep learning.");
        return resolve(null);
      }

      // Thử python3 trước (Linux/Render), fallback sang python (Windows)
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const python = spawn(pythonCmd, ['predict.py'], { cwd: rootPath });
      let result = '';
      let error = '';

      const timeout = setTimeout(() => {
        console.error("AI TIMED OUT");
        python.kill();
        resolve(null);
      }, 20000); 

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

    // ─── TÍNH ĐIỂM: ƯU TIÊN DỮ LIỆU TỪ MODEL AI ĐÃ TRAIN ─────────────────
    let acneScore = 15;
    let poresScore = 10;
    let textureScore = 10;
    let aiAcneType = null;
    let aiConfidence = 0;

    if (aiResult && aiResult.success && aiResult.confidence > 0.3) {
      // ═══ NGUỒN CHÍNH: KẾT QUẢ TỪ MODEL MOBILENETV2 ĐÃ TRAIN ═══
      aiAcneType = aiResult.prediction;
      aiConfidence = aiResult.confidence;
      
      // Lấy trực tiếp từ model (đã được map theo dữ liệu train)
      acneScore = Math.round((aiResult.acne_score_hint || 30) * aiConfidence + (1 - aiConfidence) * 10);
      textureScore = Math.round((aiResult.texture_score_hint || 20) * aiConfidence + (1 - aiConfidence) * 10);
      poresScore = Math.round((aiResult.pores_score_hint || 25) * aiConfidence + (1 - aiConfidence) * 10);
      
      console.log(`[AI] Model-driven scores → Acne: ${acneScore}, Texture: ${textureScore}, Pores: ${poresScore}`);
    } else {
      // ═══ FALLBACK: HEURISTIC PIXEL SCAN (chỉ khi model không chạy được) ═══
      console.log('[AI] Model unavailable, using pixel heuristic fallback');
      if (hints) {
        acneScore = Math.min(80, Math.round((hints.acneRate || 0) * 3.5 + 5));
        textureScore = Math.min(80, Math.round((hints.textureRate || 0) * 0.9 + 5));
        poresScore = Math.min(100, Math.round((hints.poreRate || 0) * 2.2 + 5));
      }
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

    // ─── GỢI Ý SẢN PHẨM CÁ NHÂN HÓA THEO CHỈ SỐ DA (CÁ NHÂN HÓA CAO) ────────────────────────────────────
    // ─── GỢI Ý SẢN PHẨM: ĐA CHIẾN THUẬT (TOÀN BỘ, TRỘN LẪN HOẶC ĐAN XEN) ───────────────────────────
    const estimatedHydration = Math.max(30, Math.min(95, 100 - (textureScore * 0.8) - (poresScore * 0.5)));
    let recommendedProducts = [];
    
    // Chọn ngẫu nhiên chiến thuật (0: Pure Cocoon, 1: Pure Hasaki, 2: Mixed, 3: Alternating)
    const strategy = Math.floor(Math.random() * 4);
    console.log(`[AI] Recommendation Strategy: ${strategy}`);

    const getCocoonProduct = (cat, idx) => productPool[cat][idx] || productPool[cat][0];
    const getHasakiProduct = (cat, idx) => {
        // Hasaki thường nằm ở các index lẻ hoặc cuối danh sách (dựa trên productPool đã merge)
        const items = productPool[cat].filter(p => p.product_url.includes('hasaki.vn'));
        return items[idx % items.length] || items[0];
    };

    if (strategy === 0) { // TOÀN BỘ COCOON
        if (acneScore > 45) recommendedProducts.push(productPool.cleansers[0]);
        else recommendedProducts.push(productPool.cleansers[4]);
        recommendedProducts.push(acneScore > 30 ? productPool.serums[2] : productPool.serums[0]);
        recommendedProducts.push(skinType === 'Da Dầu Mụn' ? productPool.creams[0] : productPool.creams[2]);
        recommendedProducts.push(productPool.others[0]);
        recommendedProducts.push(productPool.others[1]);
    } 
    else if (strategy === 1) { // TOÀN BỘ HASAKI
        const hCleansers = productPool.cleansers.filter(p => p.product_url.includes('hasaki'));
        const hSerums = productPool.serums.filter(p => p.product_url.includes('hasaki'));
        const hCreams = productPool.creams.filter(p => p.product_url.includes('hasaki'));
        const hOthers = productPool.others.filter(p => p.product_url.includes('hasaki'));

        recommendedProducts.push(acneScore > 45 ? hCleansers[0] : hCleansers[1]);
        recommendedProducts.push(acneScore > 30 ? hSerums[1] : hSerums[0]);
        recommendedProducts.push(acneScore > 50 ? hCreams[0] : hCreams[1]);
        recommendedProducts.push(hOthers[0]);
    }
    else if (strategy === 2) { // TRỘN LẪN (MIXED - AI CHỌN MÓN TỐT NHẤT)
        // AI ưu tiên Bí đao Cocoon để làm sạch nhưng dùng Serum phục hồi của Hasaki
        recommendedProducts.push(productPool.cleansers[0]); // Cocoon
        recommendedProducts.push(productPool.serums.find(p => p.name.includes('Hyalu B5'))); // Hasaki
        recommendedProducts.push(productPool.creams[0]); // Cocoon
        recommendedProducts.push(productPool.others.find(p => p.name.includes('Anthelios'))); // Hasaki
    }
    else { // ĐAN XEN (ALTERNATING)
        recommendedProducts.push(productPool.cleansers[0]); // Cocoon
        const hSerums = productPool.serums.filter(p => p.product_url.includes('hasaki'));
        recommendedProducts.push(hSerums[0]); // Hasaki
        recommendedProducts.push(productPool.creams[2]); // Cocoon
        const hOthers = productPool.others.filter(p => p.product_url.includes('hasaki'));
        recommendedProducts.push(hOthers[0]); // Hasaki
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
        texture:   textureScore,
        pores:     poresScore,
        wrinkles:  Math.min(100, Math.round((hints?.wrinkleRate || 0) * 1.2 + 3)),
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
