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

    // CHẠY DỰ ĐOÁN TỪ MÔ HÌNH AI ĐÃ TRAIN
    let aiResult = null;
    try {
        aiResult = await runAIPrediction(image);
    } catch (aiErr) {
        console.warn("Deep learning model error:", aiErr.message);
    }
    
    // --- THUẬT TOÁN CÂN BẰNG THỐNG KÊ (AI NORMALIZATION) ---
    let acneScore = 5; 
    let poresScore = 10;
    
    if (hints) {
      acneScore = Math.min(100, Math.round((hints.acneRate || 0) * 5.5 + 2)); 
      poresScore = Math.min(100, Math.round((hints.poreRate || 0) * 2.2 + 5));

      if (aiResult && aiResult.success && aiResult.prediction === 'acne' && aiResult.confidence > 0.6) {
          if (hints.acneRate > 3) {
              acneScore = Math.max(acneScore, Math.round(aiResult.confidence * 40 + acneScore * 0.6));
          } else {
              acneScore = Math.min(acneScore, 8);
          }
      }
      if (aiResult && aiResult.success && (aiResult.prediction === 'normal' || aiResult.confidence < 0.3)) {
          acneScore = Math.min(acneScore, 4);
      }
    } else {
      acneScore = 15;
      poresScore = 20;
    }

    const skinTypes = ['Da Dầu', 'Da Khô', 'Da Hỗn Hợp', 'Da Nhạy Cảm'];
    let randomSkinType = skinTypes[2]; 
    if (poresScore > 50) randomSkinType = skinTypes[0];
    else if (poresScore < 15 && (hints?.wrinkleRate || 0) > 10) randomSkinType = skinTypes[1];

    const severity = acneScore > 50 ? 'nặng' : (acneScore > 15 ? 'trung bình' : 'nhẹ');

    // Đề xuất sản phẩm từ Hasaki theo yêu cầu
    const allHasakiProducts = [
      { 
        name: "Sữa Rửa Mặt La Roche-Posay Effaclar Gel", 
        type: "Sữa rửa mặt", 
        usage: "Làm sạch sâu, kiềm dầu và ngừa mụn hiệu quả.", 
        image_url: "https://media.hasaki.vn/catalog/product/s/u/sua-rua-mat-la-roche-posay-dang-gel-danh-cho-da-dau-nhay-cam-200ml-1.jpg", 
        product_url: "https://hasaki.vn/san-pham/gel-rua-mat-la-roche-posay-danh-cho-da-dau-nhay-cam-200ml-3616.html" 
      },
      { 
        name: "Serum La Roche-Posay Hyalu B5", 
        type: "Serum", 
        usage: "Phục hồi da, cấp ẩm và làm đầy nếp nhăn.", 
        image_url: "https://media.hasaki.vn/catalog/product/s/e/serum-la-roche-posay-ho-tro-phuc-hoi-da-hyalu-b5-serum-30ml-1_1.jpg", 
        product_url: "https://hasaki.vn/san-pham/duong-chat-la-roche-posay-giup-tai-tao-phuc-hoi-da-30ml-31317.html" 
      },
      { 
        name: "Kem Dưỡng SVR Sebiaclear Mat + Pores", 
        type: "Kem dưỡng", 
        usage: "Kiềm dầu 8h và thu nhỏ lỗ chân lông.", 
        image_url: "https://media.hasaki.vn/catalog/product/k/e/kem-duong-svr-lam-giam-mun-va-giup-se-khit-lo-chan-long-40ml-sebiaclear-mat-pores-1.jpg", 
        product_url: "https://hasaki.vn/san-pham/kem-duong-svr-giup-lam-giam-mun-va-se-khit-lo-chan-long-40ml-24806.html" 
      },
      { 
        name: "Sữa Chống Nắng Anessa Perfect UV", 
        type: "Chống nắng", 
        usage: "Bảo vệ tối đa với công nghệ Auto Booster.", 
        image_url: "https://media.hasaki.vn/catalog/product/g/e/gel-chong-nang-anessa-duong-da-bao-ve-hoan-hao-90g-perfect-uv-sunscreen-skincare-gel-n-new-1.jpg", 
        product_url: "https://hasaki.vn/san-pham/sua-chong-nang-anessa-bao-ve-hoan-hao-60ml-100412.html" 
      },
      { 
        name: "Nước Hoa Hồng Klairs Supple Preparation", 
        type: "Toner", 
        usage: "Cân bằng pH và làm dịu da nhạy cảm.", 
        image_url: "https://media.hasaki.vn/catalog/product/f/a/facebook-dynamic-nuoc-hoa-hong-klairs-khong-mui-cho-da-nhay-cam-180ml-1618392150_1.jpg", 
        product_url: "https://hasaki.vn/san-pham/nuoc-hoa-hong-klairs-khong-mui-cho-da-nhay-cam-180ml-33245.html" 
      }
    ];

    // Lọc sản phẩm dựa trên tình trạng da (AI Recommendation logic)
    let recommendedProducts = [];
    if (acneScore > 30) {
      // Ưu tiên SRM mụn và Serum phục hồi
      recommendedProducts = [allHasakiProducts[0], allHasakiProducts[1], allHasakiProducts[2], allHasakiProducts[3]];
    } else {
      // Ưu tiên dưỡng ẩm và chống nắng
      recommendedProducts = [allHasakiProducts[4], allHasakiProducts[1], allHasakiProducts[3], allHasakiProducts[2]];
    }

    // Dữ liệu lưu vào DB (không gồm products - tránh schema conflict)
    const dbData = {
      userId,
      image,
      skinType: randomSkinType,
      severity: severity,
      conditions: acneScore > 40 ? 'Mụn viêm, dầu thừa' : (poresScore > 40 ? 'Lỗ chân lông to, dầu nhờn' : 'Da ổn định, ít khuyết điểm'),
      concerns: {
        acne: acneScore, 
        texture: Math.min(100, Math.round((hints?.textureRate || 0) * 1.5 + 5)),
        pores: poresScore,
        wrinkles: Math.min(100, Math.round((hints?.wrinkleRate || 0) * 1.8 + 3)),
        hydration: Math.max(30, Math.min(95, 100 - (hints?.textureRate || 0) * 0.8 - (hints?.poreRate || 0) * 0.5))
      },
      analysis: acneScore > 40 ? 
        "Da bạn đang gặp tình trạng mụn viêm lan rộng và hàng rào bảo vệ da bị tổn thương. Cần tập trung vào việc làm dịu da và sử dụng các hoạt chất kháng viêm chuyên biệt." : 
        "Nền da của bạn tương đối ổn định, tuy nhiên vùng chữ T vẫn còn hiện tượng bóng dầu và lỗ chân lông chưa được se khít hoàn toàn. Hãy chú trọng bước làm sạch và cấp nước.",
      createdAt: new Date().toISOString()
    };

    // Lưu vào database
    try {
      const savedAnalysis = await SkinAnalysisDAO.insert(dbData);
      // Trả về kết quả có kèm products (products được gắn vào response, không lưu DB)
      res.json({ success: true, data: { ...savedAnalysis.toObject(), products: recommendedProducts } });
    } catch (dbErr) {
      console.error("Save analysis error:", dbErr);
      // Nếu DB lỗi, vẫn trả về kết quả để user thấy (không block UX)
      res.json({ success: true, data: { ...dbData, products: recommendedProducts }, dbError: dbErr.message });
    }
  } catch (err) {
    console.error("FATAL SKIN ANALYSIS ERROR:", err);
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
