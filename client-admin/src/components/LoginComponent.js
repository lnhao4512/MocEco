import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class Login extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = { txtUsername: '', txtPassword: '', error: '', loading: false };
  }
  render() {
    if (this.context.token === '') {
      return (
        <div className="login-page">
          <div className="login-card">
            {/* Logo */}
            <div className="login-logo">
              <div className="login-logo__icon">👗</div>
              <div>
                <div className="login-logo__text">FashionStore</div>
                <div className="login-logo__sub">Admin Panel</div>
              </div>
            </div>

            <h1 className="login-title">Đăng nhập</h1>
            <p className="login-sub">Nhập thông tin tài khoản quản trị viên</p>

            {this.state.error && (
              <div className="login-error">⚠ {this.state.error}</div>
            )}

            <form onSubmit={(e) => this.btnLoginClick(e)}>
              <div className="form-group">
                <label className="form-label">Tên đăng nhập</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="admin"
                  value={this.state.txtUsername}
                  onChange={(e) => this.setState({ txtUsername: e.target.value, error: '' })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={this.state.txtPassword}
                  onChange={(e) => this.setState({ txtPassword: e.target.value, error: '' })}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                type="submit"
                style={{ padding: '12px', fontSize: 14, marginTop: 8 }}
                disabled={this.state.loading}
              >
                {this.state.loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
              </button>
            </form>

            <div className="login-footer">
              FashionStore Admin · v2.0
            </div>
          </div>
        </div>
      );
    }
    return <div />;
  }
  btnLoginClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername.trim();
    const password = this.state.txtPassword;
    if (!username || !password) {
      this.setState({ error: 'Vui lòng nhập đầy đủ username và password' });
      return;
    }
    this.setState({ loading: true });
    this.apiLogin({ username, password });
  }
  apiLogin(account) {
    axios.post('/api/admin/login', account).then((res) => {
      const result = res.data;
      this.setState({ loading: false });
      if (result.success === true) {
        this.context.setToken(result.token);
        this.context.setUsername(account.username);
      } else {
        this.setState({ error: result.message || 'Đăng nhập thất bại' });
      }
    }).catch((error) => {
      this.setState({ loading: false, error: error.response?.data?.message || 'Không thể kết nối máy chủ' });
    });
  }
}
export default Login;