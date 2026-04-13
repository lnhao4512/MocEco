import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Home extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      stats: { products: 0, categories: 0, orders: 0, customers: 0, revenue: 0, pending: 0 },
      recentOrders: [],
      shippingFee: 0,
      savingShipping: false,
      loading: true
    };
  }

  render() {
    const { stats, recentOrders, loading } = this.state;
    const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';

    const statusBadge = (s) => {
      if (!s) return <span className="badge badge-gray">—</span>;
      const sUpper = s.toUpperCase();
      const map = { PENDING: 'badge-yellow', PROCESSING: 'badge-yellow', APPROVED: 'badge-green', COMPLETED: 'badge-green', SHIPPING: 'badge-blue', CANCELED: 'badge-red', CANCELLED: 'badge-red' };
      const label = { PENDING: '⏳ Chờ', PROCESSING: '🔄 Chờ', APPROVED: '✅ Đã duyệt', COMPLETED: '✅ Xong', SHIPPING: '🚚 Giao', CANCELED: '❌ Hủy', CANCELLED: '❌ Hủy' };
      return <span className={`badge ${map[sUpper] || 'badge-gray'}`}>{label[sUpper] || sUpper}</span>;
    };
    const payBadge = (s) => {
      const sL = String(s).toLowerCase();
      if (sL === 'paid') return <span className="badge badge-green">✅ Đã TT</span>;
      return <span className="badge badge-yellow">⏳ Chưa TT</span>;
    };

    return (
      <div>
        {/* ── Stat cards ────────────────────────────── */}
        <div className="stat-grid">
          <div className="stat-card stat-card--purple">
            <div className="stat-card__icon">👕</div>
            <div>
              <div className="stat-card__label">Sản phẩm</div>
              <div className="stat-card__value">{loading ? '…' : stats.products}</div>
              <div className="stat-card__delta">↑ Tổng số sản phẩm</div>
            </div>
          </div>
          <div className="stat-card stat-card--blue">
            <div className="stat-card__icon">📦</div>
            <div>
              <div className="stat-card__label">Đơn hàng</div>
              <div className="stat-card__value">{loading ? '…' : stats.orders}</div>
              <div className="stat-card__delta" style={{ color: 'var(--c-yellow)' }}>
                {stats.pending > 0 ? `⏳ ${stats.pending} chờ xử lý` : '✅ Không có đơn chờ'}
              </div>
            </div>
          </div>
          <div className="stat-card stat-card--green">
            <div className="stat-card__icon">💰</div>
            <div>
              <div className="stat-card__label">Doanh thu</div>
              <div className="stat-card__value" style={{ fontSize: 20 }}>{loading ? '…' : fmtPrice(stats.revenue)}</div>
              <div className="stat-card__delta">↑ Đơn đã duyệt</div>
            </div>
          </div>
          <div className="stat-card stat-card--yellow">
            <div className="stat-card__icon">👥</div>
            <div>
              <div className="stat-card__label">Khách hàng</div>
              <div className="stat-card__value">{loading ? '…' : stats.customers}</div>
              <div className="stat-card__delta">↑ Tài khoản đã đăng ký</div>
            </div>
          </div>
        </div>

        {/* ── Quick info row ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Categories stat */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📂 Danh mục</span>
            </div>
            <div className="card-body">
              <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 8 }}>
                {loading ? '…' : stats.categories}
              </div>
              <div className="text-muted text-sm">Tổng số danh mục (tất cả cấp)</div>
            </div>
          </div>
          {/* Pending orders */}
          <div className="card" style={{ borderColor: stats.pending > 0 ? 'var(--c-yellow)' : undefined }}>
            <div className="card-header">
              <span className="card-title">⏳ Đơn chờ xử lý</span>
            </div>
            <div className="card-body">
              <div style={{ fontSize: 40, fontWeight: 800, color: stats.pending > 0 ? 'var(--c-yellow)' : 'var(--c-green)', marginBottom: 8 }}>
                {loading ? '…' : stats.pending}
              </div>
              <div className="text-muted text-sm">
                {stats.pending > 0 ? 'Cần duyệt ngay →' : 'Không có đơn hàng nào đang chờ'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cài đặt Giao hàng ──────────────────────── */}
        <div className="card" style={{ marginBottom: 24, padding: '24px 28px', background: 'var(--c-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <span className="card-title" style={{ fontSize: 18 }}>🚚 Cài đặt Phí Vận Chuyển</span>
              <div className="text-muted text-sm" style={{ marginTop: 4 }}>Cập nhật phí giao hàng toàn quốc áp dụng cho Đơn Checkout mới</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 200 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', fontWeight: 600 }}>₫</span>
              <input
                type="number"
                className="form-input"
                style={{ paddingLeft: 34, fontSize: 16, fontWeight: 700 }}
                value={this.state.shippingFee}
                onChange={e => this.setState({ shippingFee: e.target.value })}
                disabled={this.state.savingShipping}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={() => this.apiUpdateShippingFee()}
              disabled={this.state.savingShipping || loading}
            >
              {this.state.savingShipping ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
            </button>
          </div>
        </div>

        {/* ── Recent orders ──────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <span className="card-title">📋 Đơn hàng gần đây</span>
            <span className="badge badge-blue">{recentOrders.length} đơn</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Thời gian</th>
                  <th>Khách hàng</th>
                  <th>Địa chỉ nhận</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--c-muted)', padding: 32 }}>Đang tải...</td></tr>
                ) : recentOrders.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--c-muted)', padding: 32 }}>Chưa có đơn hàng nào</td></tr>
                ) : recentOrders.map((o) => {
                  const pDate = o.createdAt || o.cdate;
                  const cName = o.fullName  || o.customer?.name || '?';
                  const cPho  = o.phone     || o.customer?.phone || '';
                  const cMail = o.email     || o.customer?.email || '';
                  const total = (o.totalAmount || o.total || 0) + (o.shippingFee || 0);
                  const addr  = o.address ? [o.address.street, o.address.ward, o.address.district, o.address.city].filter(Boolean).join(', ') : '';
                  const prods = o.items ? o.items.map(i => `${i.name || i.product?.name} (Size ${i.size||'—'}) x${i.quantity}`).join(' | ') : '';
                  const isCOD = o.paymentMethod === 'cod';

                  return (
                    <tr key={o._id}>
                      <td className="td-id">…{String(o._id).slice(-8)}</td>
                      <td className="muted">{pDate ? new Date(pDate).toLocaleString('vi-VN') : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {cName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{cName}</div>
                            <div style={{ color: 'var(--c-muted)', fontSize: 11 }}>{cPho} - {cMail}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--c-muted)', maxWidth: 160 }}>{addr}</td>
                      <td style={{ fontSize: 12, color: 'var(--c-muted)', maxWidth: 220 }}>{prods}</td>
                      <td style={{ fontWeight: 700, color: 'var(--c-green)' }}>{fmtPrice(total)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                           <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)' }}>{isCOD ? '🚚 COD' : '🏦 CK'}</span>
                           {payBadge(o.paymentStatus)}
                        </div>
                      </td>
                      <td>{statusBadge(o.orderStatus || o.status)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.loadDashboard();
  }

  async loadDashboard() {
    const config = { headers: { 'x-access-token': this.context.token } };
    try {
      const [resProducts, resCategories, resOrders, resCustomers, resRecent] = await Promise.allSettled([
        axios.get('/api/admin/products', config),
        axios.get('/api/admin/categories', config),
        axios.get('/api/admin/orders', config),
        axios.get('/api/admin/customers', config),
        axios.get('/api/admin/orders/recent', config)
      ]);

      const products     = resProducts.status   === 'fulfilled' ? resProducts.value.data   : { products: [] };
      const categories   = resCategories.status === 'fulfilled' ? resCategories.value.data : [];
      const orders       = resOrders.status     === 'fulfilled' ? resOrders.value.data     : [];
      const customers    = resCustomers.status  === 'fulfilled' ? resCustomers.value.data  : [];
      const rencent      = resRecent.status     === 'fulfilled' ? resRecent.value.data     : [];

      const allProducts   = Array.isArray(products.products) ? products.products : (Array.isArray(products) ? products : []);
      const allCategories = Array.isArray(categories) ? categories : [];
      const allOrders     = Array.isArray(orders)     ? orders     : [];
      const allCustomers  = Array.isArray(customers)  ? customers  : [];
      const recentOrders  = Array.isArray(rencent)    ? rencent    : [];

      const revenue = allOrders
        .filter(o => o.status === 'APPROVED' || o.orderStatus === 'completed' || o.paymentStatus === 'paid')
        .reduce((s, o) => s + (o.total || o.totalAmount || 0), 0);
      const pending = allOrders.filter(o => o.status === 'PENDING' || o.orderStatus === 'processing').length;

      this.setState({
        stats: {
          products:   allProducts.length  + (products.noPages ? (products.noPages - 1) * 4 : 0),
          categories: allCategories.length,
          orders:     allOrders.length,
          customers:  allCustomers.length,
          revenue,
          pending
        },
        recentOrders,
        loading: false
      });

      // Get shipping config
      try {
        const resShip = await axios.get('/api/admin/shipping-config', config);
        if (resShip.data && resShip.data.config) {
          this.setState({ shippingFee: resShip.data.config.fee });
        }
      } catch (e) {
        console.warn('Could not load shipping config:', e);
      }
    } catch (e) {
      this.setState({ loading: false });
    }
  }

  async apiUpdateShippingFee() {
    const { shippingFee } = this.state;
    if (shippingFee === '' || Number(shippingFee) < 0) {
      alert('Vui lòng nhập phí ship hợp lệ (>= 0)');
      return;
    }
    this.setState({ savingShipping: true });
    try {
      const config = { headers: { 'x-access-token': this.context.token } };
      const res = await axios.put('/api/admin/shipping-config', { fee: Number(shippingFee) }, config);
      if (res.data.success) {
        alert('Cập nhật phí giao hàng thành công!');
        this.setState({ shippingFee: res.data.config.fee });
      } else {
        alert('Lỗi: ' + res.data.message);
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      this.setState({ savingShipping: false });
    }
  }
}
export default Home;