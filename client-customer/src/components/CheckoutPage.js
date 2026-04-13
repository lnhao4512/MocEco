import React, { Component } from 'react';
import axios from 'axios';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';
import vietnamAddress from '../data/vietnam-address.json';
import '../styles/Checkout.css';

// ── Constants ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Liên hệ',    icon: '✉️' },
  { id: 2, label: 'Địa chỉ',   icon: '📍' },
  { id: 3, label: 'Thanh toán', icon: '💳' }
];

// ── Validators ────────────────────────────────────────────────────────────────
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => /^0[0-9]{9}$/.test(v);

class CheckoutPage extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      step: 1,

      // Step 1 – contact
      email: '',
      emailError: '',

      // Step 2 – address
      firstName: '',
      lastName: '',
      street: '',
      building: '',
      city: '',
      district: '',
      ward: '',
      phone: '',
      phoneError: '',
      // Dropdown options
      districts: [],
      wards: [],
      // Terms
      termAge:   false,
      termData:  false,
      termTerms: false,

      // Step 3 – payment
      paymentMethod: 'cod',
      qrCodeUrl: '',
      qrAmount: 0,
      orderId: '',
      orderData: null,
      shippingFee: 70000, // Default, will be loaded from server

      // UI state
      loading:  false,
      verifying: false,
      paymentDone: false,
      error: ''
    };
  }

  componentDidMount() {
    const { customer } = this.context;
    if (!customer) {
      this.props.navigate('/login');
      return;
    }
    const mycart = this.context.mycart;
    if (!mycart || mycart.length === 0) {
      this.props.navigate('/mycart');
      return;
    }
    // Pre-fill email
    this.setState({ email: customer.email || '' });

    // Pre-fill name if available
    if (customer.name) {
      const parts = customer.name.trim().split(' ');
      const lastName  = parts.pop() || '';
      const firstName = parts.join(' ');
      this.setState({ firstName, lastName });
    }
    if (customer.phone) this.setState({ phone: customer.phone });

    // Load dynamic shipping config
    this.apiGetShippingConfig();

    // Socket listener for payment_success
    this._setupSocket();
  }

  async apiGetShippingConfig() {
    try {
      const res = await axios.get('/api/shipping-config');
      if (res.data && res.data.config) {
        this.setState({ shippingFee: res.data.config.fee });
      }
    } catch (err) {
      console.warn('Could not load shipping config:', err);
    }
  }

  componentWillUnmount() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  _setupSocket() {
    try {
      const { io } = require('socket.io-client');
      const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });
      socket.on('payment_success', (data) => {
        const { orderId } = this.state;
        if (data.orderId === String(orderId) || data.orderId === orderId) {
          this.setState({ paymentDone: true });
          setTimeout(() => {
            this.context.setMycart([]);
            this.props.navigate('/checkout/success', { state: { order: data.order || this.state.orderData } });
          }, 1500);
        }
      });
      this._socket = socket;
    } catch (e) {
      console.warn('Socket init error:', e.message);
    }
  }

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  getCartTotal() {
    return this.context.mycart.reduce((sum, item) => {
      return sum + (item.unitPrice || item.product?.price || 0) * item.quantity;
    }, 0);
  }

  // ── Step navigation ─────────────────────────────────────────────────────────
  goNext() {
    this.setState(prev => ({ step: prev.step + 1, error: '' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  goBack() {
    this.setState(prev => ({ step: prev.step - 1, error: '' }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Step 1: Email validation ─────────────────────────────────────────────────
  handleEmailChange(v) {
    const emailError = v && !isValidEmail(v) ? 'Email không đúng định dạng' : '';
    this.setState({ email: v, emailError });
  }

  isStep1Valid() {
    const { email } = this.state;
    return email && isValidEmail(email);
  }

  // ── Step 2: Address ─────────────────────────────────────────────────────────
  handleCityChange(cityName) {
    const province = vietnamAddress.find(p => p.name === cityName);
    this.setState({
      city: cityName,
      district: '',
      ward: '',
      districts: province ? province.districts : [],
      wards: []
    });
  }

  handleDistrictChange(districtName) {
    const { city } = this.state;
    const province = vietnamAddress.find(p => p.name === city);
    const dist = province?.districts.find(d => d.name === districtName);
    this.setState({
      district: districtName,
      ward: '',
      wards: dist ? dist.wards : []
    });
  }

  handlePhoneChange(v) {
    const phoneError = v && !isValidPhone(v) ? 'SĐT phải bắt đầu bằng 0 và đủ 10 số' : '';
    this.setState({ phone: v, phoneError });
  }

  isStep2Valid() {
    const { firstName, lastName, street, city, district, ward, phone, termAge, termData, termTerms } = this.state;
    return (
      firstName.trim() && lastName.trim() &&
      street.trim() && city && district && ward &&
      phone && isValidPhone(phone) &&
      termAge && termData && termTerms
    );
  }

  // ── Step 3: Place order ─────────────────────────────────────────────────────
  async placeOrder() {
    const { customer, mycart, token } = this.context;
    const { email, firstName, lastName, street, building, city, district, ward, phone, paymentMethod, shippingFee } = this.state;

    const totalAmount = this.getCartTotal();
    const items = mycart.map(item => ({
      productId: item.product._id,
      name:      item.product.name,
      image:     item.product.image || '',
      quantity:  item.quantity,
      price:     item.unitPrice || item.product.price || 0
    }));

    const body = {
      userId: customer._id,
      email,
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      address: { street, building, ward, district, city, country: 'Việt Nam' },
      items,
      totalAmount,
      paymentMethod
    };

    this.setState({ loading: true, error: '' });

    try {
      const config = { headers: { 'x-access-token': token } };
      const res = await axios.post('/api/orders', body, config);
      if (res.data.success) {
        const order = res.data.order;
        this.setState({
          orderId: String(order._id),
          orderData: order,
          qrCodeUrl: order.qrCodeUrl || '',
          qrAmount: totalAmount + shippingFee,
          loading: false
        });
        // COD: redirect immediately
        if (paymentMethod === 'cod') {
          this.context.setMycart([]);
          this.props.navigate('/checkout/success', { state: { order } });
        }
      } else {
        this.setState({ loading: false, error: res.data.message || 'Đặt hàng thất bại' });
      }
    } catch (err) {
      this.setState({ loading: false, error: err.response?.data?.message || err.message });
    }
  }

  // ── Manual payment verify ────────────────────────────────────────────────────
  async verifyPayment() {
    const { orderId, token: _tok } = this.state;
    const { token } = this.context;
    if (!orderId) return;

    this.setState({ verifying: true, error: '' });
    try {
      const config = { headers: { 'x-access-token': token } };
      const res = await axios.post('/api/payment/verify', { orderId }, config);
      if (res.data.success) {
        this.setState({ paymentDone: true, verifying: false });
        setTimeout(() => {
          this.context.setMycart([]);
          this.props.navigate('/checkout/success', { state: { order: res.data.order } });
        }, 1500);
      } else {
        this.setState({ verifying: false, error: res.data.message || 'Xác nhận thất bại' });
      }
    } catch (err) {
      this.setState({ verifying: false, error: err.response?.data?.message || err.message });
    }
  }

  // ── Render cart mini ────────────────────────────────────────────────────────
  renderCartSummary() {
    const { mycart } = this.context;
    const { shippingFee } = this.state;
    const fmt = v => Number(v).toLocaleString('vi-VN') + ' ₫';
    const total = this.getCartTotal();

    return (
      <div className="checkout-summary">
        <h3 className="summary-title">Đơn hàng của bạn</h3>
        <div className="summary-items">
          {mycart.map((item, i) => {
            const unitPrice = item.unitPrice || item.product?.price || 0;
            const imgSrc = item.product?.image
              ? (item.product.image.startsWith('http') || item.product.image.startsWith('data:')
                  ? item.product.image : 'data:image/jpg;base64,' + item.product.image)
              : null;
            return (
              <div key={i} className="summary-item">
                <div className="summary-item__img">
                  {imgSrc ? <img src={imgSrc} alt={item.product.name} /> : <span>👕</span>}
                  <span className="summary-item__qty">{item.quantity}</span>
                </div>
                <div className="summary-item__info">
                  <div className="summary-item__name">{item.product.name}</div>
                </div>
                <div className="summary-item__price">{fmt(unitPrice * item.quantity)}</div>
              </div>
            );
          })}
        </div>
        <div className="summary-totals">
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{fmt(total)}</span>
          </div>
          <div className="summary-row">
            <span>Phí giao hàng</span>
            <span>{fmt(shippingFee)}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Tổng cộng</span>
            <span>{fmt(total + shippingFee)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Email ────────────────────────────────────────────────────────────
  renderStep1() {
    const { email, emailError } = this.state;
    return (
      <div className="checkout-form-section">
        <h2 className="section-title">📧 Thông tin liên hệ</h2>
        <p className="section-desc">Email sẽ được dùng để gửi xác nhận đơn hàng.</p>

        <div className={`form-group ${emailError ? 'has-error' : ''}`}>
          <label className="form-label">Email <span className="required">*</span></label>
          <input
            id="checkout-email"
            className="form-input"
            type="email"
            value={email}
            onChange={e => this.handleEmailChange(e.target.value)}
            placeholder="ban@example.com"
            autoComplete="email"
          />
          {emailError && <div className="form-error">{emailError}</div>}
        </div>

        <button
          id="checkout-next-1"
          className="btn-checkout-primary"
          disabled={!this.isStep1Valid()}
          onClick={() => this.goNext()}
        >
          Tiếp theo →
        </button>
      </div>
    );
  }

  // ── Step 2: Address ──────────────────────────────────────────────────────────
  renderStep2() {
    const { firstName, lastName, street, building, city, district, ward,
            phone, phoneError, districts, wards,
            termAge, termData, termTerms } = this.state;

    return (
      <div className="checkout-form-section">
        <h2 className="section-title">📍 Địa chỉ giao hàng</h2>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Họ <span className="required">*</span></label>
            <input id="checkout-firstName" className="form-input" value={firstName}
              onChange={e => this.setState({ firstName: e.target.value })}
              placeholder="Nguyễn" autoComplete="given-name" />
          </div>
          <div className="form-group">
            <label className="form-label">Tên <span className="required">*</span></label>
            <input id="checkout-lastName" className="form-input" value={lastName}
              onChange={e => this.setState({ lastName: e.target.value })}
              placeholder="Văn A" autoComplete="family-name" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Số nhà / Tên đường <span className="required">*</span></label>
          <input id="checkout-street" className="form-input" value={street}
            onChange={e => this.setState({ street: e.target.value })}
            placeholder="VD: 123 Đường Lê Lợi" autoComplete="address-line1" />
        </div>

        <div className="form-group">
          <label className="form-label">Tòa nhà / Số tầng <span className="optional">(Tùy chọn)</span></label>
          <input id="checkout-building" className="form-input" value={building}
            onChange={e => this.setState({ building: e.target.value })}
            placeholder="VD: Tầng 2, Chung cư ABC" autoComplete="address-line2" />
        </div>

        <div className="form-group">
          <label className="form-label">Tỉnh / Thành phố <span className="required">*</span></label>
          <select id="checkout-city" className="form-select" value={city}
            onChange={e => this.handleCityChange(e.target.value)}>
            <option value="">-- Chọn tỉnh thành --</option>
            {vietnamAddress.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quận / Huyện <span className="required">*</span></label>
            <select id="checkout-district" className="form-select" value={district}
              onChange={e => this.handleDistrictChange(e.target.value)}
              disabled={!city}>
              <option value="">-- Chọn quận/huyện --</option>
              {districts.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Phường / Xã <span className="required">*</span></label>
            <select id="checkout-ward" className="form-select" value={ward}
              onChange={e => this.setState({ ward: e.target.value })}
              disabled={!district}>
              <option value="">-- Chọn phường/xã --</option>
              {wards.map((w, i) => <option key={i} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Quốc gia</label>
          <input className="form-input" value="Việt Nam" readOnly style={{ background: 'var(--ck-surface2)', cursor: 'not-allowed' }} />
        </div>

        <div className={`form-group ${phoneError ? 'has-error' : ''}`}>
          <label className="form-label">Số điện thoại <span className="required">*</span></label>
          <input id="checkout-phone" className="form-input" value={phone}
            onChange={e => this.handlePhoneChange(e.target.value)}
            placeholder="0901234567" type="tel" autoComplete="tel" />
          {phoneError && <div className="form-error">{phoneError}</div>}
        </div>

        {/* Terms */}
        <div className="terms-section">
          <h3 className="terms-title">📋 Điều khoản</h3>
          {[
            { key: 'termAge',   id: 'term-age',   label: 'Tôi xác nhận tôi trên 16 tuổi' },
            { key: 'termData',  id: 'term-data',  label: 'Tôi đồng ý cho phép chia sẻ dữ liệu cá nhân để xử lý đơn hàng' },
            { key: 'termTerms', id: 'term-terms', label: 'Tôi đã đọc và đồng ý với Điều khoản sử dụng và Chính sách bảo mật' }
          ].map(t => (
            <label key={t.key} className="checkbox-label" htmlFor={t.id}>
              <input
                id={t.id}
                type="checkbox"
                className="checkbox-input"
                checked={this.state[t.key]}
                onChange={e => this.setState({ [t.key]: e.target.checked })}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-text">{t.label} <span className="required">*</span></span>
            </label>
          ))}
        </div>

        <div className="form-actions">
          <button id="checkout-back-2" className="btn-checkout-ghost" onClick={() => this.goBack()}>← Quay lại</button>
          <button
            id="checkout-next-2"
            className="btn-checkout-primary"
            disabled={!this.isStep2Valid()}
            onClick={() => this.goNext()}
          >
            Tiếp theo →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Payment ─────────────────────────────────────────────────────────
  renderStep3() {
    const { paymentMethod, qrCodeUrl, orderId, orderData,
            loading, verifying, paymentDone, error, shippingFee } = this.state;
    const fmt = v => Number(v).toLocaleString('vi-VN') + ' ₫';
    const total = this.getCartTotal();

    return (
      <div className="checkout-form-section">
        <h2 className="section-title">💳 Phương thức thanh toán</h2>

        <div className="payment-options">
          {/* COD */}
          <label
            id="payment-cod-label"
            className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}
            htmlFor="payment-cod"
          >
            <input id="payment-cod" type="radio" name="paymentMethod" value="cod"
              checked={paymentMethod === 'cod'}
              onChange={() => this.setState({ paymentMethod: 'cod', qrCodeUrl: '', orderId: '', orderData: null })} />
            <div className="payment-option__icon">🚚</div>
            <div className="payment-option__info">
              <div className="payment-option__name">Thanh toán khi nhận hàng (COD)</div>
              <div className="payment-option__desc">Trả tiền mặt khi nhận hàng</div>
            </div>
            {paymentMethod === 'cod' && <span className="payment-option__check">✓</span>}
          </label>

          {/* Bank Transfer */}
          <label
            id="payment-bank-label"
            className={`payment-option ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
            htmlFor="payment-bank"
          >
            <input id="payment-bank" type="radio" name="paymentMethod" value="bank_transfer"
              checked={paymentMethod === 'bank_transfer'}
              onChange={() => this.setState({ paymentMethod: 'bank_transfer', qrCodeUrl: '', orderId: '', orderData: null })} />
            <div className="payment-option__icon">🏦</div>
            <div className="payment-option__info">
              <div className="payment-option__name">Chuyển khoản ngân hàng (VietQR)</div>
              <div className="payment-option__desc">Vietcombank – 1039549947 – LUONG NHAT HAO</div>
            </div>
            {paymentMethod === 'bank_transfer' && <span className="payment-option__check">✓</span>}
          </label>
        </div>

        {/* Shipping info */}
        <div className="shipping-info-box">
          <div className="shipping-info-box__icon">🚀</div>
          <div>
            <div className="shipping-info-box__title">Giao hàng tiêu chuẩn</div>
            <div className="shipping-info-box__detail">Phí ship: {fmt(shippingFee)} • Nhận hàng trong 2–4 ngày làm việc</div>
          </div>
        </div>

        {error && <div className="checkout-error">{error}</div>}

        {/* ── QR Payment Display (after order placed) ──────────── */}
        {paymentMethod === 'bank_transfer' && orderId && qrCodeUrl && (
          <div className="qr-section">
            <div className="qr-card">
              <div className="qr-card__header">
                <span className="qr-card__bank">🏦 Vietcombank</span>
                <span className="qr-card__status">Chờ thanh toán…</span>
              </div>
              <div className="qr-card__body">
                <img
                  className="qr-card__img"
                  src={qrCodeUrl}
                  alt="VietQR Code"
                  onError={e => { e.target.style.display='none'; }}
                />
                <div className="qr-card__details">
                  <div className="qr-card__row"><span>Ngân hàng</span><strong>Vietcombank</strong></div>
                  <div className="qr-card__row"><span>Số tài khoản</span><strong>1039549947</strong></div>
                  <div className="qr-card__row"><span>Chủ tài khoản</span><strong>LUONG NHAT HAO</strong></div>
                  <div className="qr-card__row"><span>Số tiền</span><strong className="qr-amount">{fmt(total + shippingFee)}</strong></div>
                  <div className="qr-card__row"><span>Nội dung CK</span>
                    <strong className="qr-content">ORDER_{orderId.slice(-10).toUpperCase()}</strong>
                  </div>
                </div>
              </div>
              <div className="qr-card__notice">
                <span>⚠️</span>
                <span>Vui lòng nhập đúng <strong>nội dung chuyển khoản</strong> để đơn được xác nhận tự động</span>
              </div>

              {paymentDone ? (
                <div className="qr-success-banner">✅ Thanh toán thành công! Đang chuyển hướng…</div>
              ) : (
                <button
                  id="btn-confirm-payment"
                  className="btn-checkout-confirm"
                  disabled={verifying}
                  onClick={() => this.verifyPayment()}
                >
                  {verifying ? '⏳ Đang xác nhận…' : '✅ Tôi đã chuyển khoản'}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button id="checkout-back-3" className="btn-checkout-ghost"
            onClick={() => this.goBack()} disabled={loading || !!orderId}>
            ← Quay lại
          </button>

          {/* Only show Place Order if order not yet placed */}
          {!orderId && (
            <button
              id="btn-place-order"
              className="btn-checkout-primary"
              disabled={loading}
              onClick={() => this.placeOrder()}
            >
              {loading ? '⏳ Đang đặt hàng…' : paymentMethod === 'cod' ? '🛒 Đặt hàng ngay' : '🏦 Tạo đơn & nhận QR'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  render() {
    const { step } = this.state;

    return (
      <div className="checkout-page">
        {/* Progress bar */}
        <div className="checkout-progress">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`progress-step ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                <div className="progress-step__circle">
                  {step > s.id ? '✓' : s.icon}
                </div>
                <div className="progress-step__label">{s.label}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`progress-line ${step > s.id ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="checkout-content">
          {/* Left: form */}
          <div className="checkout-left">
            {step === 1 && this.renderStep1()}
            {step === 2 && this.renderStep2()}
            {step === 3 && this.renderStep3()}
          </div>

          {/* Right: order summary */}
          <div className="checkout-right">
            {this.renderCartSummary()}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(CheckoutPage);
