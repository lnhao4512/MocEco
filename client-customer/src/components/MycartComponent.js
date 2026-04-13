import axios from 'axios';
import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';

class Mycart extends Component {
  static contextType = MyContext;

  render() {
    const mycart = this.context.mycart;

    const rows = mycart.map((item, index) => {
      const imgSrc = item.product && item.product.image
        ? (item.product.image.startsWith('http') || item.product.image.startsWith('data:')
          ? item.product.image
          : 'data:image/jpg;base64,' + item.product.image)
        : '';
      // Dùng unitPrice đã lưu lúc add (nếu có), fallback về product.price
      const unitPrice = item.unitPrice || item.product.price || 0;
      const amount = unitPrice * item.quantity;

      return (
        <tr key={item.cartKey || item.product._id}>
          <td>{index + 1}</td>
          <td style={{ fontSize: 11, color: '#888' }}>{String(item.product._id).slice(-8)}</td>
          <td>{item.product.name}</td>
          <td>{item.product.category && item.product.category.name}</td>
// (Removed SIZE column)
          <td><img src={imgSrc} width="60px" height="60px" alt="" style={{ objectFit: 'cover', borderRadius: 6 }} /></td>
          <td className="text-right">{Number(unitPrice).toLocaleString('vi-VN')} ₫</td>
          <td className="text-center">{item.quantity}</td>
          <td className="text-right" style={{ fontWeight: 700 }}>{Number(amount).toLocaleString('vi-VN')} ₫</td>
          <td>
            <span
              className="link"
              style={{ color: '#ef4444' }}
              onClick={() => this.lnkRemoveClick(item.cartKey || item.product._id)}
            >
              Xóa
            </span>
          </td>
        </tr>
      );
    });

    const total = mycart.reduce((sum, item) => {
      const unitPrice = item.unitPrice || item.product.price || 0;
      return sum + unitPrice * item.quantity;
    }, 0);

    return (
      <div className="ads-container" style={{ padding: '24px 0' }}>
        <h2 className="text-center" style={{ fontSize: '24px', letterSpacing: '0.08em', marginBottom: '16px' }}>GIỎ HÀNG CỦA BẠN</h2>
        {mycart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 40, background: '#f3f4f6', borderRadius: 12 }}>
            Giỏ hàng trống. <a href="/" style={{ color: '#111', fontWeight: 700 }}>Tiếp tục mua sắm →</a>
          </div>
        ) : (
          <div className="ads-table-wrap">
            <table className="ads-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
// (Removed th Size)
                  <th>Ảnh</th>
                  <th className="text-right">Đơn giá</th>
                  <th className="text-center">SL</th>
                  <th className="text-right">Thành tiền</th>
                  <th className="text-center">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {rows}
                <tr style={{ background: '#f9fafb' }}>
                  <td colSpan="6"></td>
                  <td className="text-right" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '.08em' }}>Tổng cộng</td>
                  <td className="text-right" style={{ fontWeight: 900, fontSize: 18, color: '#111' }}>
                    {Number(total).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="text-center">
                    <button className="ads-btn ads-btn--primary" onClick={() => this.lnkCheckoutClick()}>
                      THANH TOÁN
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  lnkRemoveClick(cartKey) {
    const itemToRemove = this.context.mycart.find(x => (x.cartKey || x.product._id) === cartKey);
    const mycart = this.context.mycart.filter(x =>
      (x.cartKey || x.product._id) !== cartKey
    );

    if (this.context.customer && itemToRemove) {
      const body = {
        userId: this.context.customer._id,
        productId: itemToRemove.product._id
      };
      const config = { headers: { 'x-access-token': this.context.token }, data: body }; // axios delete req body goes in `data`
      axios.delete('/api/customer/cart/remove', config).then(() => {
         this.context.setMycart(mycart);
      }).catch(err => {
         console.error('Cart remove err', err);
         this.context.setMycart(mycart);
      });
    } else {
      this.context.setMycart(mycart);
    }
  }

  lnkCheckoutClick() {
    if (this.context.mycart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }
    if (!this.context.customer) {
      this.props.navigate('/login');
      return;
    }
    // Navigate to the full checkout flow
    this.props.navigate('/checkout');
  }

  apiCheckout(total, items, customer) {
    const body = { total, items, customer };
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.post('/api/customer/checkout', body, config).then((res) => {
      if (res.data) {
        alert('✅ Đặt hàng thành công!');
        this.context.setMycart([]);
        this.props.navigate('/home');
      } else {
        alert('❌ Đặt hàng thất bại!');
      }
    }).catch(err => {
      console.error(err);
      alert('Lỗi kết nối khi đặt hàng');
    });
  }
}

export default withRouter(Mycart);
