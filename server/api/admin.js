const express = require('express');
const router = express.Router();
// utils
const JwtUtil = require('../utils/JwtUtil');
// daos
const AdminDAO = require('../models/AdminDAO');
const CategoryDAO = require('../models/CategoryDAO');
const ProductDAO = require('../models/ProductDAO');
const OrderDAO = require('../models/OrderDAO');
const CustomerDAO = require('../models/CustomerDAO');
const AboutDAO = require('../models/AboutDAO');
const HeroDAO = require('../models/HeroDAO');

// multer setup for video uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for now, user can adjust
});

// login
router.post('/login', async function (req, res) {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '').trim();
    if (username && password) {
      const admin = await AdminDAO.selectByUsernameAndPassword(username, password);
      if (admin) {
        const token = JwtUtil.genToken(admin.username, admin.password);
        res.json({ success: true, message: 'Authentication successful', token: token });
      } else {
        res.json({ success: false, message: 'Incorrect username or password' });
      }
    } else {
      res.json({ success: false, message: 'Please input username and password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/token', JwtUtil.checkToken, function (req, res) {
  try {
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    res.json({ success: true, message: 'Token is valid', token: token });
  } catch (error) {
    console.error('Token check error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===================== CATEGORY =====================

// Lấy tất cả categories (flat list)
router.get('/categories', JwtUtil.checkToken, async function (req, res) {
  try {
    const categories = await CategoryDAO.selectAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy categories dạng cây (tree structure)
router.get('/categories/tree', JwtUtil.checkToken, async function (req, res) {
  try {
    const tree = await CategoryDAO.selectTree();
    res.json(tree);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy chỉ leaf categories (không có con) – dùng cho dropdown chọn category sản phẩm
router.get('/categories/leaves', JwtUtil.checkToken, async function (req, res) {
  try {
    const leaves = await CategoryDAO.selectLeaves();
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo category mới (có thể có parentId)
router.post('/categories', JwtUtil.checkToken, async function (req, res) {
  try {
    const name = req.body.name;
    const parentId = req.body.parentId || null;
    if (!name) return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
    const category = { name, parentId };
    const result = await CategoryDAO.insert(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật category
router.put('/categories/:id', JwtUtil.checkToken, async function (req, res) {
  try {
    const _id = req.params.id;
    const name = req.body.name;
    const parentId = req.body.parentId || null;
    const category = { _id, name, parentId };
    const result = await CategoryDAO.update(category);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa category (kiểm tra không có con)
router.delete('/categories/:id', JwtUtil.checkToken, async function (req, res) {
  try {
    const _id = req.params.id;
    const result = await CategoryDAO.delete(_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ===================== PRODUCT =====================
router.get('/products', JwtUtil.checkToken, async function (req, res) {
  var products = await ProductDAO.selectAll();
  const sizePage = 4;
  const noPages = Math.ceil(products.length / sizePage);
  var curPage = 1;
  if (req.query.page) curPage = parseInt(req.query.page);
  const offset = (curPage - 1) * sizePage;
  products = products.slice(offset, offset + sizePage);
  const result = { products: products, noPages: noPages, curPage: curPage };
  res.json(result);
});

router.post('/products', JwtUtil.checkToken, async function (req, res) {
  try {
    const name = req.body.name;
    const price = req.body.price;
    const cid = req.body.category;
    const image = req.body.image;
    let stockNum = parseInt(req.body.stock);
    if (isNaN(stockNum)) stockNum = 0;
    const stock = stockNum;
    const now = new Date().getTime();

    // Kiểm tra category phải là leaf node
    const leaves = await CategoryDAO.selectLeaves();
    const isLeaf = leaves.some((l) => String(l._id) === String(cid));
    if (!isLeaf) {
      return res.status(400).json({ success: false, message: 'Sản phẩm chỉ được gắn vào danh mục cấp cuối (leaf)' });
    }

    const category = await CategoryDAO.selectByID(cid);
    const product = { name, price, image, cdate: now, category, stock, updatedAt: new Date() };
    const result = await ProductDAO.insert(product);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put('/products', JwtUtil.checkToken, async function (req, res) {
  try {
    const _id = req.body.id;
    const name = req.body.name;
    const price = req.body.price;
    const cid = req.body.category;
    const image = req.body.image;
    let stockNum = parseInt(req.body.stock);
    if (isNaN(stockNum)) stockNum = 0;
    const stock = stockNum;
    const now = new Date().getTime();

    // DEBUG - xoa sau khi fix
    console.log('[DEBUG PUT /products] stock nhan tu client:', JSON.stringify(req.body.stock), '=> parseInt:', stock);

    // Kiem tra category phai la leaf node
    const leaves = await CategoryDAO.selectLeaves();
    const isLeaf = leaves.some((l) => String(l._id) === String(cid));
    if (!isLeaf) {
      return res.status(400).json({ success: false, message: 'San pham chi duoc gan vao danh muc cap cuoi (leaf)' });
    }

    const category = await CategoryDAO.selectByID(cid);
    const product = { _id, name, price, image, cdate: now, category, stock, updatedAt: new Date() };
    const result = await ProductDAO.update(product);

    console.log('[DEBUG PUT /products] DB ket qua stock:', result && result.stock);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// (Removed size endpoint)

router.delete('/products/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const result = await ProductDAO.delete(_id);
  res.json(result);
});

// ===================== CUSTOMER =====================
router.get('/customers', JwtUtil.checkToken, async function (req, res) {
  const customers = await CustomerDAO.selectAll();
  res.json(customers);
});

router.put('/customers/deactive/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const token = req.body.token;
  const result = await CustomerDAO.active(_id, token, 0);
  res.json(result);
});

router.get('/customers/sendmail/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const cust = await CustomerDAO.selectByID(_id);
  if (cust) {
    const send = await require('../utils/EmailUtil').send(cust.email, cust._id, cust.token);
    if (send) {
      res.json({ success: true, message: 'Please check email' });
    } else {
      res.json({ success: false, message: 'Email failure' });
    }
  } else {
    res.json({ success: false, message: 'Not exists customer' });
  }
});

// ===================== ORDER =====================
// Lấy 5 đơn hàng gần đây nhất
router.get('/orders/recent', JwtUtil.checkToken, async function (req, res) {
  try {
    const orders = await OrderDAO.selectRecent(5); // We will add selectRecent to OrderDAO
    res.json(orders);
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/orders', JwtUtil.checkToken, async function (req, res) {
  const orders = await OrderDAO.selectAll();
  res.json(orders);
});

router.put('/orders/status/:id', JwtUtil.checkToken, async function (req, res) {
  const _id = req.params.id;
  const newStatus = req.body.status;
  const result = await OrderDAO.update(_id, newStatus);
  res.json(result);
});

router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  const _cid = req.params.cid;
  const orders = await OrderDAO.selectByCustID(_cid);
  res.json(orders);
});

// test endpoint - get all admins
router.get('/all', async function (req, res) {
  try {
    const admins = await AdminDAO.selectAll();
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// test endpoint - create admin
router.post('/create', async function (req, res) {
  try {
    const username = req.body.username;
    const password = req.body.password;
    if (username && password) {
      const admin = await AdminDAO.insert(username, password);
      res.json({ success: true, message: 'Admin created', data: admin });
    } else {
      res.json({ success: false, message: 'Please provide username and password' });
    }
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===================== SHIPPING CONFIG =====================
const { store: appStore } = require('../utils/InMemoryStore');
const MyConstants = require('../utils/MyConstants');

// GET current shipping config
router.get('/shipping-config', JwtUtil.checkToken, function (req, res) {
  res.json({ success: true, config: appStore.shippingConfig });
});

// PUT update shipping config
router.put('/shipping-config', JwtUtil.checkToken, function (req, res) {
  try {
    const { fee, freeShipThreshold, estDays, note } = req.body;

    if (fee !== undefined) {
      const n = Number(fee);
      if (isNaN(n) || n < 0) return res.status(400).json({ success: false, message: 'Phí ship không hợp lệ (phải ≥ 0)' });
      appStore.shippingConfig.fee = n;
    }
    if (freeShipThreshold !== undefined) {
      const t = Number(freeShipThreshold);
      if (isNaN(t) || t < 0) return res.status(400).json({ success: false, message: 'Ngưỡng miễn phí ship phải ≥ 0' });
      appStore.shippingConfig.freeShipThreshold = t;
    }
    if (estDays !== undefined) appStore.shippingConfig.estDays = String(estDays).trim();
    if (note    !== undefined) appStore.shippingConfig.note    = String(note).trim();

    appStore.shippingConfig.updatedAt = new Date().toISOString();

    // Also sync to MyConstants so existing checkout.js can read it
    MyConstants.SHIPPING_FEE = appStore.shippingConfig.fee;

    // Emit socket event so connected clients know fee changed
    const io = req.app.get('io');
    if (io) io.emit('shipping_config_updated', appStore.shippingConfig);

    res.json({ success: true, message: 'Cập nhật phí ship thành công', config: appStore.shippingConfig });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ===================== ABOUT (BRAND STORY) =====================

router.get('/about', JwtUtil.checkToken, async function (req, res) {
  try {
    const about = await AboutDAO.select();
    res.json(about);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/about', JwtUtil.checkToken, async function (req, res) {
  try {
    const aboutData = req.body;
    const result = await AboutDAO.update(aboutData);
    if (result) {
      res.json({ success: true, message: 'Cập nhật thành công', data: result });
    } else {
      res.json({ success: false, message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===================== HERO VIDEO =====================

router.get('/hero', JwtUtil.checkToken, async function (req, res) {
  try {
    const hero = await HeroDAO.select();
    res.json(hero);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/hero', JwtUtil.checkToken, async function (req, res) {
  try {
    const heroData = req.body;
    const result = await HeroDAO.update(heroData);
    if (result) {
      res.json({ success: true, message: 'Cập nhật thành công', data: result });
    } else {
      res.json({ success: false, message: 'Cập nhật thất bại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/hero/upload', JwtUtil.checkToken, upload.single('video'), async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const videoUrl = `/uploads/${req.file.filename}`;
    
    // Auto-update Hero table with new video URL
    await HeroDAO.update({ video: videoUrl });
    
    res.json({ success: true, message: 'Upload thành công', videoUrl: videoUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;