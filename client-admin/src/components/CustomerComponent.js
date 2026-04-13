import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Customer extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      customers: [],
      selectedCustomer: null,
      orders: [],
      order: null,
      search: '',
      filterActive: 'ALL'  // ALL | ACTIVE | INACTIVE
    };
  }

  render() {
    const { customers, selectedCustomer, orders, order, search, filterActive } = this.state;
    const fmtPrice = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';

    // Filter customers
    let filtered = customers;
    if (filterActive === 'ACTIVE')   filtered = filtered.filter(c => c.active === 1);
    if (filterActive === 'INACTIVE') filtered = filtered.filter(c => c.active === 0);
    if (search) filtered = filtered.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    );

    const activeCount   = customers.filter(c => c.active === 1).length;
    const inactiveCount = customers.filter(c => c.active === 0).length;

    const customerRows = filtered.map((item) => {
      const isSelected = selectedCustomer && selectedCustomer._id === item._id;
      const initials = item.name
        ? item.name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
        : item.username?.[0]?.toUpperCase() || '?';

      return (
        <tr key={item._id} onClick={() => this.selectCustomer(item)}
          style={{ background: isSelected ? 'var(--c-accent-glow)' : undefined }}>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name || item.username}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>@{item.username}</div>
              </div>
            </div>
          </td>
          <td className="muted">{item.email}</td>
          <td className="muted">{item.phone}</td>
          <td>
            {item.active === 1
              ? <span className="badge badge-green">✅ Hoạt động</span>
              : <span className="badge badge-red">❌ Chưa kích hoạt</span>}
          </td>
          <td onClick={e => e.stopPropagation()}>
            {item.active === 0 ? (
              <button className="btn btn-ghost btn-xs"
                onClick={() => this.apiSendmail(item._id)}>📧 Gửi mail</button>
            ) : (
              <button className="btn btn-danger btn-xs"
                onClick={() => { if (window.confirm('Vô hiệu hóa tài khoản này?')) this.apiDeactive(item._id, item.token); }}>
                ⊘ Vô hiệu hóa
              </button>
            )}
          </td>
        </tr>
      );
    });

    // Order history panel
    const orderHistoryPanel = selectedCustomer && (
      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 0 }}>
            <div>
              <span className="card-title">📦 Lịch sử đơn hàng</span>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
                Khách: <strong>{selectedCustomer.name}</strong> · {selectedCustomer.email}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-gray">{orders.length} đơn</span>
              <button className="btn btn-ghost btn-sm"
                onClick={() => this.setState({ selectedCustomer: null, orders: [], order: null })}>
                ✕ Đóng
              </button>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 14 }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--c-muted)', padding: 32 }}>
                Khách hàng chưa có đơn hàng nào
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Thời gian</th>
                      <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const sm = { PENDING: 'badge-yellow', APPROVED: 'badge-green', CANCELED: 'badge-red' };
                      const lm = { PENDING: '⏳ Chờ xử lý', APPROVED: '✅ Đã duyệt', CANCELED: '❌ Đã hủy' };
                      const isOrderSel = order && order._id === o._id;
                      return (
                        <tr key={o._id} onClick={() => this.setState({ order: o })}
                          style={{ background: isOrderSel ? 'var(--c-accent-glow)' : undefined }}>
                          <td className="td-id">…{String(o._id).slice(-8)}</td>
                          <td className="muted">{new Date(o.cdate).toLocaleString('vi-VN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-green)' }}>
                            {fmtPrice(o.total)}
                          </td>
                          <td><span className={`badge ${sm[o.status] || 'badge-gray'}`}>{lm[o.status] || o.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // Order item detail
    const orderItemPanel = order && (
      <div style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 14 }}>
            <span className="card-title">🧾 Chi tiết đơn #{String(order._id).slice(-8)}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ order: null })}>✕</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản phẩm</th>
                  <th>Size</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'center' }}>SL</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const imgSrc = item.product.image
                    ? (item.product.image.startsWith('http') || item.product.image.startsWith('data:')
                      ? item.product.image : 'data:image/jpg;base64,' + item.product.image)
                    : null;
                  const unitPrice = item.unitPrice || item.product.price || 0;
                  return (
                    <tr key={idx}>
                      <td className="muted">{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'var(--c-surface2)', flexShrink: 0 }}>
                            {imgSrc
                              ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👕</div>}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.product.name}</span>
                        </div>
                      </td>
                      <td>
                        {item.size
                          ? <span className="badge badge-gray">{item.size}</span>
                          : <span style={{ color: 'var(--c-border2)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{fmtPrice(unitPrice)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>×{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>
                        {fmtPrice(unitPrice * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--c-border)' }}>
                  <td colSpan="4" />
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--c-muted)', padding: '12px 16px' }}>TỔNG</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--c-green)', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {fmtPrice(order.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );

    return (
      <div>
        {/* Filter & search bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'ALL',      label: 'Tất cả',           count: customers.length },
            { key: 'ACTIVE',   label: '✅ Hoạt động',     count: activeCount       },
            { key: 'INACTIVE', label: '❌ Chưa kích hoạt', count: inactiveCount    },
          ].map(tab => (
            <button key={tab.key}
              className={`btn btn-sm ${filterActive === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => this.setState({ filterActive: tab.key })}>
              {tab.label}
              <span className="sidebar-link__badge"
                style={{ background: filterActive === tab.key ? 'rgba(255,255,255,.25)' : undefined }}>
                {tab.count}
              </span>
            </button>
          ))}
          <div className="toolbar-search" style={{ marginLeft: 'auto', maxWidth: 280 }}>
            <span className="toolbar-search__icon">🔍</span>
            <input className="toolbar-search__input"
              placeholder="Tên, username, email, SĐT..."
              value={search}
              onChange={(e) => this.setState({ search: e.target.value })} />
          </div>
        </div>

        {/* Customer table */}
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customerRows.length > 0 ? customerRows : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 48, color: 'var(--c-muted)' }}>
                      {search ? `Không tìm thấy "${search}"` : 'Chưa có khách hàng nào'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order history + detail */}
        {orderHistoryPanel}
        {orderItemPanel}
      </div>
    );
  }

  componentDidMount() { this.apiGetCustomers(); }

  selectCustomer(item) {
    this.setState({ selectedCustomer: item, orders: [], order: null });
    this.apiGetOrdersByCustomer(item._id);
  }

  apiGetCustomers() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/customers', config).then((res) => {
      this.setState({ customers: res.data });
    }).catch(err => console.error('Get customers:', err.message));
  }

  apiGetOrdersByCustomer(cid) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/orders/customer/' + cid, config).then((res) => {
      this.setState({ orders: res.data });
    }).catch(() => this.setState({ orders: [] }));
  }

  apiDeactive(id, token) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/admin/customers/deactive/' + id, { token }, config).then(() => {
      this.apiGetCustomers();
    }).catch(err => alert('❌ ' + err.message));
  }

  apiSendmail(id) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/customers/sendmail/' + id, config).then((res) => {
      alert(res.data.message || 'Đã gửi email kích hoạt!');
    }).catch(err => alert('❌ ' + err.message));
  }
}
export default Customer;
