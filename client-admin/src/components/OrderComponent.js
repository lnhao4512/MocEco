import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import { io } from 'socket.io-client';

const STATUS_MAP = {
  PENDING:  { label: '⏳ Chờ xử lý', cls: 'badge-yellow' },
  APPROVED: { label: '✅ Đã duyệt',   cls: 'badge-green'  },
  CANCELED: { label: '❌ Đã hủy',     cls: 'badge-red'    },
};

const PAY_STATUS = {
  pending: { label: '⏳ Chưa TT', cls: 'badge-yellow' },
  paid:    { label: '✅ Đã TT',    cls: 'badge-green'  },
};

const ORDER_STATUS = {
  processing: { label: '🔄 Đang xử lý', cls: 'badge-yellow' },
  shipping:   { label: '🚚 Đang giao',  cls: 'badge-blue'   },
  completed:  { label: '✅ Hoàn tất',   cls: 'badge-green'  },
};

const fmt = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';

class Order extends Component {
  static contextType = MyContext;

  constructor(props) {
    super(props);
    this.state = {
      // Legacy orders
      orders: [],
      order: null,
      filterStatus: 'ALL',
      search: '',
      // Checkout orders tab
      tab: 'legacy',   // 'legacy' | 'checkout'
      checkoutOrders: [],
      checkoutOrder: null,
      // Stats
      totalRevenue: 0,
      unpaidCount: 0
    };
    this._socket = null;
  }

  componentDidMount() {
    if (this.context?.token) {
      this.apiGetOrders();
      this.apiGetCheckoutOrders();
    }
    this._initSocket();
  }

  componentWillUnmount() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }

  _initSocket() {
    try {
      const socket = io('http://localhost:3001', { transports: ['websocket', 'polling'] });
      socket.on('payment_success', () => {
        // Auto-refresh checkout orders on payment
        this.apiGetCheckoutOrders();
      });
      socket.on('order_status_updated', () => {
        this.apiGetCheckoutOrders();
      });
      this._socket = socket;
    } catch (e) {
      console.warn('Admin socket error:', e.message);
    }
  }

  // ── Stats calculation ─────────────────────────────────────────────────────────
  calcStats(checkoutOrders) {
    const paid = checkoutOrders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paid.reduce((s, o) => s + (o.totalAmount || 0) + (o.shippingFee || 0), 0);
    const unpaidCount = checkoutOrders.filter(o => o.paymentStatus === 'pending').length;
    this.setState({ totalRevenue, unpaidCount });
  }

  // ── Render tab: Legacy Orders ─────────────────────────────────────────────────
  renderLegacyTab() {
    const { orders, order, filterStatus, search } = this.state;

    let filtered = orders;
    if (filterStatus !== 'ALL') filtered = filtered.filter(o => o.status === filterStatus);
    if (search) filtered = filtered.filter(o =>
      o.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.phone?.includes(search)
    );

    const pendingCount  = orders.filter(o => o.status === 'PENDING').length;
    const approvedCount = orders.filter(o => o.status === 'APPROVED').length;
    const canceledCount = orders.filter(o => o.status === 'CANCELED').length;

    const orderRows = filtered.map((item) => {
      const dbStatus = item.status || (item.orderStatus === 'processing' ? 'PENDING' : item.orderStatus === 'completed' ? 'APPROVED' : item.orderStatus === 'canceled' ? 'CANCELED' : item.orderStatus);
      const { label, cls } = STATUS_MAP[dbStatus] || { label: dbStatus, cls: 'badge-gray' };
      const isSelected = order && order._id === item._id;
      
      const pDate = item.cdate || item.createdAt;
      const custName = item.customer?.name || item.fullName || '?';
      const custPhone = item.customer?.phone || item.phone || '';
      const totalSum = item.total || item.totalAmount || 0;
      
      return (
        <tr key={item._id} onClick={() => this.setState({ order: item })}
          style={{ background: isSelected ? 'var(--c-accent-glow)' : undefined }}>
          <td className="td-id">…{String(item._id).slice(-8)}</td>
          <td className="muted">{pDate ? new Date(pDate).toLocaleString('vi-VN') : '—'}</td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                {custName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{custName}</div>
                <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>{custPhone}</div>
              </div>
            </div>
          </td>
          <td style={{ fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>
            {fmt(totalSum)}
          </td>
          <td><span className={`badge ${cls}`}>{label}</span></td>
          <td onClick={e => e.stopPropagation()}>
            {(dbStatus === 'PENDING') && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-success btn-xs"
                  onClick={() => this.apiPutOrderStatus(item._id, 'APPROVED')}>✅ Duyệt</button>
                <button className="btn btn-danger btn-xs"
                  onClick={() => this.apiPutOrderStatus(item._id, 'CANCELED')}>❌ Hủy</button>
              </div>
            )}
          </td>
        </tr>
      );
    });

    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { key: 'ALL',      label: 'Tất cả',     count: orders.length,   cls: 'btn-primary' },
            { key: 'PENDING',  label: '⏳ Chờ',      count: pendingCount,    cls: 'btn-ghost'   },
            { key: 'APPROVED', label: '✅ Đã duyệt', count: approvedCount,   cls: 'btn-ghost'   },
            { key: 'CANCELED', label: '❌ Đã hủy',   count: canceledCount,   cls: 'btn-ghost'   },
          ].map(tab => (
            <button key={tab.key}
              className={`btn btn-sm ${filterStatus === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => this.setState({ filterStatus: tab.key, order: null })}>
              {tab.label}
              <span className="sidebar-link__badge" style={{ background: filterStatus === tab.key ? 'rgba(255,255,255,.25)' : undefined }}>
                {tab.count}
              </span>
            </button>
          ))}
          <div className="toolbar-search" style={{ marginLeft: 'auto', maxWidth: 260 }}>
            <span className="toolbar-search__icon">🔍</span>
            <input className="toolbar-search__input"
              placeholder="Tìm theo tên / số điện thoại..."
              value={search}
              onChange={(e) => this.setState({ search: e.target.value })} />
          </div>
        </div>

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th><th>Thời gian</th><th>Khách hàng</th>
                  <th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.length > 0 ? orderRows : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 48, color: 'var(--c-muted)' }}>Không có đơn hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legacy order detail */}
        {order && this.renderLegacyDetail()}
      </div>
    );
  }

  renderLegacyDetail() {
    const { order } = this.state;
    return (
      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <span className="card-title">📋 Chi tiết đơn hàng</span>
            <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ order: null })}>✕ Đóng</button>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--c-surface2)', padding: 14, borderRadius: 'var(--r-lg)', marginBottom: 14 }}>
              {[
                ['Khách hàng', order.customer?.name || order.fullName],
                ['Điện thoại', order.customer?.phone || order.phone],
                ['Email', order.customer?.email || order.email],
                ['Trạng thái', order.status || order.orderStatus]
              ].map(([k, v]) => (
                <div key={k} className="info-row" style={{ padding: '6px 0' }}>
                  <span className="info-key">{k}</span>
                  <span className="info-val" style={{ textTransform: k === 'Trạng thái' ? 'uppercase' : 'none' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Sản phẩm</th><th style={{ textAlign: 'right' }}>Đơn giá</th><th style={{ textAlign: 'center' }}>SL</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const productObj = item.product || {};
                    const imgSrc = productObj.image
                      ? (productObj.image.startsWith('http') || productObj.image.startsWith('data:')
                        ? productObj.image : 'data:image/jpg;base64,' + productObj.image)
                      : null;
                    const unitPrice = item.unitPrice || productObj.price || item.price || 0;
                    return (
                      <tr key={idx}>
                        <td className="muted">{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 6, overflow: 'hidden', background: 'var(--c-surface2)', flexShrink: 0 }}>
                              {imgSrc ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👕</div>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{productObj.name || item.name || 'Sản phẩm'}</div>
                              <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>{productObj.category?.name || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(unitPrice)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>×{item.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>{fmt(unitPrice * item.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--c-border)' }}>
                    <td colSpan="3" />
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-muted)', padding: '14px 16px' }}>TỔNG</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--c-green)', padding: '14px 16px', whiteSpace: 'nowrap' }}>{fmt(order.total || order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render tab: Checkout Orders ─────────────────────────────────────────────
  renderCheckoutTab() {
    const { checkoutOrders, checkoutOrder } = this.state;

    const rows = checkoutOrders.map(item => {
      const payBadge = PAY_STATUS[item.paymentStatus] || { label: item.paymentStatus, cls: 'badge-gray' };
      const ordBadge = ORDER_STATUS[item.orderStatus] || { label: item.orderStatus, cls: 'badge-gray' };
      const isSelected = checkoutOrder && String(checkoutOrder._id) === String(item._id);
      const addr = item.address;
      const addrStr = addr ? [addr.district, addr.city].filter(Boolean).join(', ') : '';

      return (
        <tr key={item._id} onClick={() => this.setState({ checkoutOrder: item })}
          style={{ background: isSelected ? 'var(--c-accent-glow)' : undefined }}>
          <td className="td-id">…{String(item._id).slice(-8)}</td>
          <td className="muted">{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
          <td>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.fullName}</div>
              <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>{item.phone}</div>
            </div>
          </td>
          <td style={{ fontSize: 12, color: 'var(--c-muted)' }}>{addrStr}</td>
          <td style={{ fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>
            {fmt((item.totalAmount || 0) + (item.shippingFee || 0))}
          </td>
          <td><span className={`badge ${payBadge.cls}`}>{payBadge.label}</span></td>
          <td><span className={`badge ${ordBadge.cls}`}>{ordBadge.label}</span></td>
        </tr>
      );
    });

    return (
      <div>
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th><th>Thời gian</th><th>Khách hàng</th>
                  <th>Địa chỉ</th><th>Tổng tiền</th><th>Thanh toán</th><th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows : (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: 48, color: 'var(--c-muted)' }}>Chưa có đơn hàng nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {checkoutOrder && this.renderCheckoutDetail()}
      </div>
    );
  }

  renderCheckoutDetail() {
    const { checkoutOrder: order } = this.state;
    const addr = order.address || {};
    const fullAddr = [addr.street, addr.building, addr.ward, addr.district, addr.city].filter(Boolean).join(', ');
    const payBadge = PAY_STATUS[order.paymentStatus] || { label: order.paymentStatus, cls: 'badge-gray' };
    const ordBadge = ORDER_STATUS[order.orderStatus] || { label: order.orderStatus, cls: 'badge-gray' };

    return (
      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <span className="card-title">📦 Chi tiết đơn checkout #{String(order._id).slice(-8).toUpperCase()}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                className="btn btn-ghost btn-sm"
                value={order.orderStatus}
                onChange={e => this.apiUpdateOrderStatus(order._id, e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="processing">🔄 Đang xử lý</option>
                <option value="shipping">🚚 Đang giao</option>
                <option value="completed">✅ Hoàn tất</option>
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ checkoutOrder: null })}>✕ Đóng</button>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--c-surface2)', padding: 14, borderRadius: 'var(--r-lg)', marginBottom: 14 }}>
              {[
                ['Họ tên', order.fullName],
                ['Email', order.email],
                ['SĐT', order.phone],
                ['Địa chỉ', fullAddr],
                ['Thanh toán', order.paymentMethod === 'cod' ? '🚚 COD' : '🏦 Chuyển khoản'],
                ['TT Thanh toán', <span className={`badge ${payBadge.cls}`}>{payBadge.label}</span>],
                ['TT Đơn hàng', <span className={`badge ${ordBadge.cls}`}>{ordBadge.label}</span>],
                ['Ngày tạo', new Date(order.createdAt).toLocaleString('vi-VN')],
              ].map(([k, v]) => (
                <div key={k} className="info-row" style={{ padding: '6px 0' }}>
                  <span className="info-key">{k}</span>
                  <span className="info-val">{v}</span>
                </div>
              ))}
            </div>

            {/* QR code */}
            {order.qrCodeUrl && order.paymentStatus === 'pending' && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={order.qrCodeUrl} alt="QR" style={{ maxWidth: 180, borderRadius: 8, border: '1px solid var(--c-border)' }} />
                <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 6 }}>QR chuyển khoản đơn này</div>
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>#</th><th>Sản phẩm</th><th style={{ textAlign: 'right' }}>Đơn giá</th><th style={{ textAlign: 'center' }}>SL</th><th style={{ textAlign: 'right' }}>Thành tiền</th></tr></thead>
                <tbody>
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="muted">{idx + 1}</td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmt(item.price)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>×{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>{fmt(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--c-border)' }}>
                    <td colSpan="3" />
                    <td style={{ textAlign: 'right', color: 'var(--c-muted)', padding: '10px 16px' }}>Tạm tính</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, padding: '10px 16px', whiteSpace: 'nowrap' }}>{fmt(order.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" />
                    <td style={{ textAlign: 'right', color: 'var(--c-muted)', padding: '6px 16px' }}>Phí ship</td>
                    <td style={{ textAlign: 'right', padding: '6px 16px' }}>{fmt(order.shippingFee)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" />
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--c-muted)', padding: '12px 16px' }}>TỔNG</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--c-green)', padding: '12px 16px', whiteSpace: 'nowrap' }}>{fmt((order.totalAmount || 0) + (order.shippingFee || 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  render() {
    const { tab, totalRevenue, unpaidCount, checkoutOrders, orders } = this.state;
    const paidCount = checkoutOrders.filter(o => o.paymentStatus === 'paid').length;

    return (
      <div>
        {/* Stats dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: '📦', label: 'Tổng đơn (Checkout)', value: checkoutOrders.length, color: 'var(--c-accent)' },
            { icon: '💰', label: 'Doanh thu (đã TT)',   value: fmt(totalRevenue),       color: 'var(--c-green)' },
            { icon: '⏳', label: 'Chưa thanh toán',      value: unpaidCount,             color: 'var(--c-yellow)' },
            { icon: '✅', label: 'Đơn đã thanh toán',    value: paidCount,               color: 'var(--c-green)' },
            { icon: '📋', label: 'Đơn cũ',               value: orders.length,           color: 'var(--c-muted)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            className={`btn btn-sm ${tab === 'checkout' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => this.setState({ tab: 'checkout', checkoutOrder: null })}
          >
            🛒 Đơn Checkout mới
            <span className="sidebar-link__badge">{checkoutOrders.length}</span>
          </button>
          <button
            className={`btn btn-sm ${tab === 'legacy' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => this.setState({ tab: 'legacy', order: null })}
          >
            📋 Đơn cũ (Legacy)
            <span className="sidebar-link__badge">{orders.length}</span>
          </button>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
            onClick={() => { this.apiGetOrders(); this.apiGetCheckoutOrders(); }}>
            🔄 Làm mới
          </button>
        </div>

        {tab === 'legacy'   && this.renderLegacyTab()}
        {tab === 'checkout' && this.renderCheckoutTab()}
      </div>
    );
  }

  // ── API ───────────────────────────────────────────────────────────────────────
  componentDidUpdate(prevProps, prevState) {
    if (!prevState.tab && this.state.tab) {
      // initial
    }
  }

  apiGetOrders() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/orders', config).then((res) => {
      this.setState({ orders: res.data });
    }).catch(err => console.error('Get legacy orders:', err.message));
  }

  apiGetCheckoutOrders() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/checkout-orders', config).then((res) => {
      const arr = Array.isArray(res.data) ? res.data : [];
      this.setState({ checkoutOrders: arr });
      this.calcStats(arr);
    }).catch(err => console.error('Get checkout orders:', err.message));
  }

  apiPutOrderStatus(id, status) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/admin/orders/status/' + id, { status }, config).then(() => {
      this.apiGetOrders();
      if (this.state.order?._id === id) {
        this.setState(prev => ({ order: { ...prev.order, status } }));
      }
    }).catch(err => alert('❌ ' + err.message));
  }

  apiUpdateOrderStatus(id, orderStatus) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/admin/checkout-orders/status/' + id, { orderStatus }, config).then(() => {
      this.apiGetCheckoutOrders();
      if (this.state.checkoutOrder?._id === String(id)) {
        this.setState(prev => ({ checkoutOrder: { ...prev.checkoutOrder, orderStatus } }));
      }
    }).catch(err => alert('❌ ' + err.message));
  }
}

export default Order;
