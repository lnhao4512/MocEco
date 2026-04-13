const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const EmailUtil = require('../utils/EmailUtil');
const CheckoutOrderDAO = require('../models/CheckoutOrderDAO');
const MyConstants = require('../utils/MyConstants');
const { store } = require('../utils/InMemoryStore');

// ── GET /api/shipping-config (Public) ────────────────────────────────────────
router.get('/shipping-config', function (req, res) {
  res.json({ success: true, config: store.shippingConfig });
});

// ── Helper: generate VietQR URL ─────────────────────────────────────────────
function generateVietQR(orderId, amount) {
  const bankCode   = MyConstants.BANK_CODE;
  const accountNo  = MyConstants.BANK_ACCOUNT_NO;
  const addInfo    = encodeURIComponent(`ORDER_${orderId}`);
  const accName    = encodeURIComponent(MyConstants.BANK_ACCOUNT_NAME);
  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accName}`;
}

// ── Validate helpers ─────────────────────────────────────────────────────────
function validateOrderBody(body) {
  const errors = [];
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push('Email không hợp lệ');
  if (!body.fullName || body.fullName.trim().length < 2) errors.push('Họ tên không hợp lệ');
  if (!body.phone || !/^0[0-9]{9}$/.test(body.phone)) errors.push('Số điện thoại không hợp lệ (phải bắt đầu bằng 0, đủ 10 số)');
  if (!body.address?.street)   errors.push('Địa chỉ thiếu tên đường');
  if (!body.address?.ward)     errors.push('Địa chỉ thiếu phường/xã');
  if (!body.address?.district) errors.push('Địa chỉ thiếu quận/huyện');
  if (!body.address?.city)     errors.push('Địa chỉ thiếu tỉnh/thành phố');
  if (!Array.isArray(body.items) || body.items.length === 0) errors.push('Giỏ hàng trống');
  if (!['cod', 'bank_transfer'].includes(body.paymentMethod)) errors.push('Phương thức thanh toán không hợp lệ');
  return errors;
}

// ── POST /api/orders – Tạo đơn hàng ─────────────────────────────────────────
router.post('/orders', JwtUtil.checkToken, async function (req, res) {
  try {
    const body = req.body;
    const errors = validateOrderBody(body);
    if (errors.length > 0) return res.status(400).json({ success: false, message: errors.join('; ') });

    const shippingFee = MyConstants.SHIPPING_FEE;
    const totalAmount = Number(body.totalAmount);
    if (!totalAmount || totalAmount <= 0) return res.status(400).json({ success: false, message: 'Tổng tiền không hợp lệ' });

    const orderData = {
      userId:        body.userId || '',
      email:         body.email.trim(),
      fullName:      body.fullName.trim(),
      phone:         body.phone.trim(),
      address: {
        street:   body.address.street.trim(),
        building: (body.address.building || '').trim(),
        ward:     body.address.ward.trim(),
        district: body.address.district.trim(),
        city:     body.address.city.trim(),
        country:  body.address.country || 'Việt Nam'
      },
      items: body.items.map(i => ({
        productId: String(i.productId || i._id || ''),
        name:      String(i.name || ''),
        image:     String(i.image || ''),
        quantity:  Number(i.quantity),
        price:     Number(i.price)
      })),
      totalAmount,
      shippingFee,
      paymentMethod: body.paymentMethod,
      paymentStatus: 'pending',
      orderStatus:   'processing',
      bankInfo: {
        accountNo: MyConstants.BANK_ACCOUNT_NO,
        bankCode:  MyConstants.BANK_CODE
      }
    };

    // --- KIỂM TRA VÀ TRỪ TRỮ LƯỢNG (INVENTORY ──────────────────
    const Models = require('../models/Models');
    // 1. Kiểm tra toàn bộ giỏ hàng trước
    for (let i of body.items) {
      const pid = String(i.productId || i._id);
      const p = await Models.Product.findById(pid);
      if (!p) return res.status(400).json({ success: false, message: `Sản phẩm ${i.name} không còn tồn tại hệ thống`});
      
      if (p.stock < i.quantity) {
        return res.status(400).json({ success: false, message: `Sản phẩm ${i.name} không đủ hàng (Chỉ còn ${p.stock})`});
      }
    }

    // 2. Thực hiện trừ tồn kho hàng loạt
    for (let i of body.items) {
      const pid = String(i.productId || i._id);
      await Models.Product.updateOne(
        { _id: pid },
        { 
          $inc: { stock: -Number(i.quantity) }
        }
      );
    }
    // -----------------------------------------------------------

    // Generate QR for bank transfer
    if (body.paymentMethod === 'bank_transfer') {
      // We'll generate QR after we know the orderId – insert first
      const order = await CheckoutOrderDAO.insert(orderData);
      const qrCodeUrl = generateVietQR(order._id, totalAmount + shippingFee);
      // Persist qrCodeUrl
      await CheckoutOrderDAO.updatePaymentStatus(order._id, 'pending'); // no-op but safe
      // Update qrCodeUrl in-store
      order.qrCodeUrl = qrCodeUrl;
      // For MongoDB: update the record
      const { isMongoReady } = require('../utils/DbMode');
      if (isMongoReady()) {
        const Models = require('../models/Models');
        await Models.CheckoutOrder.findByIdAndUpdate(order._id, { qrCodeUrl });
      } else {
        const { store } = require('../utils/InMemoryStore');
        const idx = store.checkoutOrders.findIndex(o => String(o._id) === String(order._id));
        if (idx !== -1) store.checkoutOrders[idx].qrCodeUrl = qrCodeUrl;
      }

      // Send order confirmation email
      const safeOrder = order.toObject ? order.toObject() : order;
      EmailUtil.sendOrderConfirmation(safeOrder.email, { ...safeOrder, qrCodeUrl }).catch(e => console.error('Email error:', e.message));

      if (orderData.userId) {
        const Models = require('../models/Models');
        await Models.Cart.updateOne({ userId: orderData.userId }, { $set: { items: [], updatedAt: new Date() } });
      }

      return res.json({ success: true, message: 'Đơn hàng đã được tạo', order: { ...safeOrder, qrCodeUrl } });
    }

    // COD: no QR
    const order = await CheckoutOrderDAO.insert(orderData);
    const safeOrder = order.toObject ? order.toObject() : order;
    EmailUtil.sendOrderConfirmation(safeOrder.email, safeOrder).catch(e => console.error('Email error:', e.message));
    
    if (orderData.userId) {
      const Models = require('../models/Models');
      await Models.Cart.updateOne({ userId: orderData.userId }, { $set: { items: [], updatedAt: new Date() } });
    }

    res.json({ success: true, message: 'Đặt hàng COD thành công', order: safeOrder });

  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/:id – Chi tiết đơn ──────────────────────────────────────
router.get('/orders/:id', JwtUtil.checkToken, async function (req, res) {
  try {
    const order = await CheckoutOrderDAO.selectById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/orders/customer/:cid – Đơn theo khách hàng ─────────────────────
router.get('/orders/customer/:cid', JwtUtil.checkToken, async function (req, res) {
  try {
    const orders = await CheckoutOrderDAO.selectByCustId(req.params.cid);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payment/qr/:orderId – Generate QR ───────────────────────────────
router.get('/payment/qr/:orderId', JwtUtil.checkToken, async function (req, res) {
  try {
    const order = await CheckoutOrderDAO.selectById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (order.paymentMethod !== 'bank_transfer') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này không dùng chuyển khoản' });
    }
    const amount = (order.totalAmount || 0) + (order.shippingFee || 0);
    const qrCodeUrl = generateVietQR(order._id, amount);
    res.json({
      success: true,
      qrCodeUrl,
      amount,
      orderId: order._id,
      bankCode:   MyConstants.BANK_CODE,
      accountNo:  MyConstants.BANK_ACCOUNT_NO,
      accountName: MyConstants.BANK_ACCOUNT_NAME,
      addInfo: `ORDER_${order._id}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/verify – Xác nhận thanh toán thủ công ─────────────────
router.post('/payment/verify', JwtUtil.checkToken, async function (req, res) {
  try {
    const { orderId, amount, content } = req.body;
    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });

    const order = await CheckoutOrderDAO.selectById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Đơn hàng đã được thanh toán', order });
    }

    // Demo-mode verify: accept if called with correct orderId
    // In production: check amount and content
    let valid = true;
    if (amount !== undefined && Number(amount) !== (order.totalAmount + order.shippingFee)) {
      valid = false; // amount mismatch
    }
    if (content !== undefined && !String(content).includes(`ORDER_${orderId}`)) {
      valid = false; // content mismatch
    }

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Thông tin thanh toán không khớp' });
    }

    const updated = await CheckoutOrderDAO.updatePaymentStatus(orderId, 'paid');
    if (!updated) {
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn hàng (Đơn hàng bị mất kết nối)' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_success', { orderId: String(orderId), order: updated });
    }

    // Send confirmation email
    EmailUtil.sendOrderConfirmation(updated.email, updated).catch(e => console.error('Email error:', e.message));

    res.json({ success: true, message: 'Thanh toán thành công', order: updated });
  } catch (err) {
    console.error('POST /api/payment/verify error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/webhook – Webhook giả lập ──────────────────────────────
router.post('/payment/webhook', async function (req, res) {
  try {
    const { orderId, amount, content, secret } = req.body;
    // Simple secret check for demo
    if (secret !== 'WEBHOOK_SECRET_2024') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });

    const order = await CheckoutOrderDAO.selectById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
    if (order.paymentStatus === 'paid') return res.json({ success: true, message: 'Already paid' });

    // Validate
    const expectedAmount = order.totalAmount + order.shippingFee;
    if (amount && Number(amount) !== expectedAmount) {
      return res.status(400).json({ success: false, message: `Số tiền sai. Cần: ${expectedAmount}` });
    }
    if (content && !String(content).includes(`ORDER_${orderId}`)) {
      return res.status(400).json({ success: false, message: 'Nội dung chuyển khoản không khớp' });
    }

    const updated = await CheckoutOrderDAO.updatePaymentStatus(orderId, 'paid');

    const io = req.app.get('io');
    if (io) io.emit('payment_success', { orderId: String(orderId), order: updated });

    res.json({ success: true, message: 'Webhook processed', order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/checkout-orders – Danh sách đơn (admin) ──────────────────
router.get('/admin/checkout-orders', JwtUtil.checkToken, async function (req, res) {
  try {
    const orders = await CheckoutOrderDAO.selectAll();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/checkout-orders/status/:id ────────────────────────────────
router.put('/admin/checkout-orders/status/:id', JwtUtil.checkToken, async function (req, res) {
  try {
    const { orderStatus } = req.body;
    const updated = await CheckoutOrderDAO.updateOrderStatus(req.params.id, orderStatus);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn' });

    const io = req.app.get('io');
    if (io) io.emit('order_status_updated', { orderId: String(req.params.id), orderStatus });

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
