import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import '../styles/Checkout.css';

class CheckoutSuccess extends Component {
  static contextType = MyContext;

  render() {
    // Get order from navigation state or context
    const order = this.props.location?.state?.order || null;
    const fmt = v => Number(v || 0).toLocaleString('vi-VN') + ' ₫';

    return (
      <div className="success-page">
        <div className="success-card">
          {/* Animated checkmark */}
          <div className="success-icon">
            <svg className="success-checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>

          <h1 className="success-heading">Đặt hàng thành công! 🎉</h1>
          <p className="success-subtext">
            Cảm ơn bạn đã mua hàng. Chúng tôi sẽ xử lý đơn hàng và giao hàng sớm nhất có thể.
          </p>

          {order && (
            <div className="success-details">
              <div className="success-detail-row">
                <span>Mã đơn hàng</span>
                <strong>#{String(order._id).slice(-10).toUpperCase()}</strong>
              </div>
              {order.fullName && (
                <div className="success-detail-row">
                  <span>Khách hàng</span>
                  <strong>{order.fullName}</strong>
                </div>
              )}
              {order.email && (
                <div className="success-detail-row">
                  <span>Email xác nhận</span>
                  <strong>{order.email}</strong>
                </div>
              )}
              {order.address && (
                <div className="success-detail-row">
                  <span>Địa chỉ</span>
                  <strong>
                    {[order.address.street, order.address.ward, order.address.district, order.address.city]
                      .filter(Boolean).join(', ')}
                  </strong>
                </div>
              )}
              {order.paymentMethod && (
                <div className="success-detail-row">
                  <span>Thanh toán</span>
                  <strong>
                    {order.paymentMethod === 'cod'
                      ? '🚚 COD – Trả khi nhận hàng'
                      : '🏦 Chuyển khoản ngân hàng'}
                  </strong>
                </div>
              )}
              {order.paymentStatus && (
                <div className="success-detail-row">
                  <span>Trạng thái</span>
                  <strong className={order.paymentStatus === 'paid' ? 'text-green' : 'text-orange'}>
                    {order.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
                  </strong>
                </div>
              )}
              {order.totalAmount && (
                <div className="success-detail-row">
                  <span>Tổng tiền</span>
                  <strong className="text-green">{fmt((order.totalAmount || 0) + (order.shippingFee || 0))}</strong>
                </div>
              )}
            </div>
          )}

          <div className="success-notice">
            <span>📧</span>
            <span>Email xác nhận đã được gửi đến hộp thư của bạn.</span>
          </div>

          <div className="success-actions">
            <button
              id="btn-continue-shopping"
              className="btn-checkout-primary"
              onClick={() => this.props.navigate('/home')}
            >
              🛍️ Tiếp tục mua sắm
            </button>
            <button
              id="btn-view-orders"
              className="btn-checkout-ghost"
              onClick={() => this.props.navigate('/myorders')}
            >
              📦 Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(CheckoutSuccess);
