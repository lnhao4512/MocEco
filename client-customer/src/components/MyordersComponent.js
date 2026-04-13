import axios from 'axios';
import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';

class Myorders extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = { orders: [], order: null };
  }
  render() {
    if (this.context.token === '') return (<Navigate replace to='/login' />);
    const orders = this.state.orders.map((item) => {
      return (
        <tr key={item._id} className="clickable" onClick={() => this.trItemClick(item)}>
          <td style={{ fontSize: 11, color: '#888' }}>{String(item._id).slice(-8)}</td>
          <td>{new Date(item.createdAt || item.cdate).toLocaleString()}</td>
          <td>{item.fullName || (item.customer && item.customer.name)}</td>
          <td>{item.phone || (item.customer && item.customer.phone)}</td>
          <td className="text-right" style={{ fontWeight: 600 }}>{Number(item.totalAmount || item.total).toLocaleString('vi-VN')} ₫</td>
          <td>
            {item.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 'COD'}
            <br />
            <small style={{ color: item.paymentStatus === 'paid' ? '#16a34a' : '#d97706' }}>
              {item.paymentStatus === 'paid' ? 'Đã TT' : 'Chưa TT'}
            </small>
          </td>
          <td style={{ fontWeight: 600, color: item.orderStatus === 'completed' ? '#16a34a' : '#2563eb' }}>
             {item.orderStatus === 'completed' ? 'Thành công' : item.orderStatus === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
          </td>
        </tr>
      );
    });
    let items = null;
    if (this.state.order) {
      items = this.state.order.items.map((item, index) => {
        const imgSrc = item.image
          ? (item.image.startsWith('http') || item.image.startsWith('data:') ? item.image : 'data:image/jpg;base64,' + item.image)
          : '';
        const price = item.price || 0;
        const amount = price * item.quantity;
        return (
          <tr key={item.productId + index}>
            <td className="text-center">{index + 1}</td>
            <td style={{ fontSize: 11, color: '#888' }}>{String(item.productId).slice(-8)}</td>
            <td>{item.name}</td>
            <td><img src={imgSrc} width="50px" height="50px" style={{ objectFit: 'cover', borderRadius: 4 }} alt="" /></td>
            <td className="text-right">{Number(price).toLocaleString('vi-VN')} ₫</td>
            <td className="text-center">{item.quantity}</td>
            <td className="text-right" style={{ fontWeight: 700 }}>{Number(amount).toLocaleString('vi-VN')} ₫</td>
          </tr>
        );
      });
    }
    return (
      <div className="ads-container" style={{ paddingTop: '24px' }}>
        <h2 className="text-center" style={{ fontSize: '24px', letterSpacing: '0.08em', marginBottom: '16px' }}>LỊCH SỬ ĐƠN HÀNG</h2>
        
        <div className="ads-table-wrap">
          <table className="ads-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ngày tạo</th>
                <th>Khách hàng</th>
                <th>Điện thoại</th>
                <th className="text-right">Tổng đơn</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders : <tr><td colSpan="7" className="text-center">Chưa có đơn hàng nào</td></tr>}
            </tbody>
          </table>
        </div>

        {this.state.order && (
          <div style={{ marginTop: '24px' }}>
            <h2 className="text-center" style={{ fontSize: '20px', letterSpacing: '0.08em', marginBottom: '16px' }}>
              CHI TIẾT ĐƠN: #{String(this.state.order._id).slice(-8)}
            </h2>
            <div className="ads-table-wrap">
              <table className="ads-table">
                <thead>
                  <tr>
                    <th className="text-center">STT</th>
                    <th>ID SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Ảnh</th>
                    <th className="text-right">Đơn giá</th>
                    <th className="text-center">SL</th>
                    <th className="text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
  componentDidMount() {
    if (this.context.customer) {
      const cid = this.context.customer._id;
      this.apiGetOrdersByCustID(cid);
    }
  }
  // event - handlers
  trItemClick(item) {
    this.setState({ order: item });
  }
  // apis
  apiGetOrdersByCustID(cid) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/orders/customer/' + cid, config).then((res) => {
      const result = res.data;
      this.setState({ orders: result });
    }).catch(err => console.error(err));
  }
}
export default Myorders;
