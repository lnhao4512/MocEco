//CLI: npm install nodemailer --save
const nodemailer = require('nodemailer');
const MyConstants = require('./MyConstants');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MyConstants.EMAIL_USER,
    pass: MyConstants.EMAIL_PASS
  }
});
const EmailUtil = {
  send(email, id, token) {
    const text = 'Thanks for signing up, please input these informations to activate your account:\n\t .id: ' + id + '\n\t .token: ' + token;
    return new Promise(function (resolve, reject) {
      const mailOptions = {
        from: MyConstants.EMAIL_USER,
        to: email,
        subject: 'Signup | Verification',
        text: text
      };
      transporter.sendMail(mailOptions, function (err, result) {
        if (err) {
          console.error('\n--- EMAIL LỔI: Bỏ qua gửi email ---');
          console.error(err.message);
          console.log('\n--- THÔNG TIN KÍCH HOẠT (ACTIVE) ---');
          console.log('Bạn vừa đăng ký Customer mới nhưng gửi email thất bại.');
          console.log('Hãy nhập thông tin sau vào trang Active:');
          console.log(' .id:    ' + id);
          console.log(' .token: ' + token);
          console.log('--------------------------------------\n');
          resolve(true); // Trả về true để bỏ qua lỗi email và cho phép Signup tiếp tục
        } else {
          resolve(true);
        }
      });
    });
  },

  // Order confirmation email
  sendOrderConfirmation(email, order) {
    const fmt = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';
    const addr = order.address || {};
    const fullAddr = [addr.street, addr.building, addr.ward, addr.district, addr.city, addr.country].filter(Boolean).join(', ');
    const isPaid = order.paymentStatus === 'paid';
    const methodLabel = order.paymentMethod === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : 'Chuyển khoản ngân hàng';

    const itemsHtml = (order.items || []).map((item, i) =>
      `<tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
        <td style="padding:8px 12px;">${item.name}</td>
        <td style="padding:8px 12px;text-align:center;">${item.size || '—'}</td>
        <td style="padding:8px 12px;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;text-align:right;">${fmt(item.price)}</td>
        <td style="padding:8px 12px;text-align:right;font-weight:700;">${fmt(item.price * item.quantity)}</td>
      </tr>`
    ).join('');

    const qrSection = order.qrCodeUrl && !isPaid
      ? `<div style="text-align:center;margin:24px 0;">
           <p style="margin:0 0 12px;font-size:14px;color:#333;">Quét mã QR dưới đây để thanh toán:</p>
           <img src="${order.qrCodeUrl}" alt="QR Code" style="max-width:220px;border:1px solid #eee;border-radius:8px;" />
           <p style="margin:8px 0 0;font-size:13px;color:#888;">Nội dung chuyển khoản: ORDER_${order._id}</p>
         </div>`
      : '';

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8" /></head>
      <body style="font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0;">
        <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
          <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:1px;">👕 Shop Online</h1>
            <p style="color:#a0aec0;margin:8px 0 0;font-size:14px;">${isPaid ? '✅ Thanh toán thành công' : '📦 Xác nhận đơn hàng'}</p>
          </div>
          <div style="padding:32px;">
            <p style="font-size:15px;color:#333;">Xin chào <strong>${order.fullName}</strong>,</p>
            <p style="font-size:14px;color:#555;">${isPaid ? 'Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ sớm xử lý và giao hàng cho bạn.' : 'Cảm ơn bạn đã đặt hàng. Dưới đây là thông tin đơn hàng của bạn.'}</p>

            <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Địa chỉ giao hàng</h3>
              <p style="margin:0;font-size:14px;color:#333;">${order.fullName} &bull; ${order.phone}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#555;">${fullAddr}</p>
            </div>

            <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
              <h3 style="margin:0 0 12px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Phương thức thanh toán</h3>
              <p style="margin:0;font-size:14px;color:#333;">${methodLabel}</p>
            </div>

            <h3 style="font-size:14px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:0;">Sản phẩm</h3>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;">
              <thead>
                <tr style="background:#1a1a2e;color:#fff;">
                  <th style="padding:10px 12px;text-align:left;">Sản phẩm</th>
                  <th style="padding:10px 12px;text-align:center;">Size</th>
                  <th style="padding:10px 12px;text-align:center;">SL</th>
                  <th style="padding:10px 12px;text-align:right;">Đơn giá</th>
                  <th style="padding:10px 12px;text-align:right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div style="border-top:2px solid #eee;margin-top:16px;padding-top:16px;">
              <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:6px;">
                <span>Tạm tính:</span><span>${fmt(order.totalAmount)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:12px;">
                <span>Phí ship:</span><span>${fmt(order.shippingFee)}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;color:#1a1a2e;">
                <span>Tổng cộng:</span><span>${fmt((order.totalAmount || 0) + (order.shippingFee || 0))}</span>
              </div>
            </div>

            ${qrSection}
          </div>
          <div style="background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#888;">
            Cảm ơn bạn đã mua hàng tại Shop Online! 👋
          </div>
        </div>
      </body></html>`;

    return new Promise((resolve) => {
      const mailOptions = {
        from: MyConstants.EMAIL_USER,
        to: email,
        subject: isPaid ? `✅ Thanh toán thành công – Đơn ${String(order._id).slice(-8).toUpperCase()}` : `📦 Xác nhận đơn hàng #${String(order._id).slice(-8).toUpperCase()}`,
        html
      };
      transporter.sendMail(mailOptions, (err) => {
        if (err) console.error('[Email] Order confirmation error:', err.message);
        resolve(!err);
      });
    });
  }
};
module.exports = EmailUtil;