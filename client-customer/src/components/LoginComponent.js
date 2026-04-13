import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../contexts/MyContext';
import withRouter from '../utils/withRouter';

class Login extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      txtUsername: 'user1',
      txtPassword: '123',
      infoMessage: ''
    };
  }

  componentDidMount() {
    const st = this.props.location && this.props.location.state;
    if (st && st.activationSuccess && st.message) {
      this.setState({ infoMessage: st.message });
    }
  }

  componentDidUpdate(prevProps) {
    const st = this.props.location && this.props.location.state;
    const prevSt = prevProps.location && prevProps.location.state;
    if (st && st !== prevSt && st.activationSuccess && st.message) {
      this.setState({ infoMessage: st.message });
    }
  }

  render() {
    return (
      <div className="ads-container ads-auth">
        <div className="ads-auth__card">
          <h1 className="ads-auth__title">Đăng nhập</h1>
          <p className="ads-auth__hint">
            Vui lòng đăng nhập để tiếp tục.
          </p>
          {this.state.infoMessage ? (
            <div className="ads-auth__banner ads-auth__banner--ok" role="status">
              {this.state.infoMessage}
            </div>
          ) : null}
          <form className="ads-auth__form" onSubmit={(e) => this.btnLoginClick(e)}>
            <label className="ads-field">
              <span className="ads-field__label">Tên đăng nhập</span>
              <input
                className="ads-field__input"
                type="text"
                autoComplete="username"
                value={this.state.txtUsername}
                onChange={(e) => this.setState({ txtUsername: e.target.value })}
              />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Mật khẩu</span>
              <input
                className="ads-field__input"
                type="password"
                autoComplete="current-password"
                value={this.state.txtPassword}
                onChange={(e) => this.setState({ txtPassword: e.target.value })}
              />
            </label>
            <button className="ads-btn ads-btn--primary ads-btn--wide" type="submit">
              Đăng nhập
            </button>
          </form>
          <p className="ads-auth__footer">
            Chưa có tài khoản? <Link to="/signup">Đăng ký</Link>
          </p>
        </div>
      </div>
    );
  }

  btnLoginClick(e) {
    e.preventDefault();
    const username = (this.state.txtUsername || '').trim();
    const password = (this.state.txtPassword || '').trim();
    if (username && password) {
      const account = { username, password };
      this.apiLogin(account);
    } else {
      alert('Vui lòng nhập tên đăng nhập và mật khẩu');
    }
  }

  apiLogin(account) {
    axios.post('/api/customer/login', account).then((res) => {
      const result = res.data;
      if (result.success === true) {
        this.context.setToken(result.token);
        this.context.setCustomer(result.customer);
        
        // Cố gắng load giỏ hàng từ DB
        // Nếu ID là mock (không phải ObjectId), Backend có thể lỗi 500
        const userId = result.customer._id;
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

        if (isValidObjectId) {
          axios.get(`/api/customer/cart/${userId}`, {
            headers: { 'x-access-token': result.token }
          }).then((cartRes) => {
            if (cartRes.data && cartRes.data.success && cartRes.data.cart) {
              const dbCartItems = cartRes.data.cart.items || [];
              const mappedCart = dbCartItems.map(item => ({
                cartKey: (item.productId && item.productId._id) ? (item.productId._id + '_' + (item.size || '')) : '',
                product: item.productId,
                quantity: item.quantity,
                size: item.size,
                unitPrice: item.price
              }));
              this.context.setMycart(mappedCart);
            }
            this.props.navigate('/home', { replace: true });
          }).catch(err => {
            console.error("Cart load err:", err);
            this.props.navigate('/home', { replace: true });
          });
        } else {
            console.warn("Using mock ID, skipping DB cart sync.");
            this.props.navigate('/home', { replace: true });
        }

      } else {
        const msg = result.message || 'Đăng nhập thất bại';
        if (msg.includes('chưa kích hoạt') || msg.toLowerCase().includes('deactive')) {
          alert(msg);
          this.props.navigate('/active');
          return;
        }
        alert(msg);
      }
    }).catch((err) => {
      console.error(err);
      alert('Đăng nhập thất bại');
    });
  }
}

export default withRouter(Login);
