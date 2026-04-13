import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txtUsername: '',
      txtPassword: '',
      txtName: '',
      txtPhone: '',
      txtEmail: ''
    };
  }
  render() {
    return (
      <div className="ads-container ads-auth">
        <div className="ads-auth__card">
          <h1 className="ads-auth__title">Đăng ký</h1>
          <p className="ads-auth__hint">
            Vui lòng điền thông tin để đăng ký tài khoản mới.
          </p>
          <form className="ads-auth__form" onSubmit={(e) => this.btnSignupClick(e)}>
            <label className="ads-field">
              <span className="ads-field__label">Tên đăng nhập</span>
              <input className="ads-field__input" type="text" autoComplete="username" value={this.state.txtUsername} onChange={e => { this.setState({ txtUsername: e.target.value }) }} />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Mật khẩu</span>
              <input className="ads-field__input" type="password" autoComplete="new-password" value={this.state.txtPassword} onChange={e => { this.setState({ txtPassword: e.target.value }) }} />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Họ tên</span>
              <input className="ads-field__input" type="text" value={this.state.txtName} onChange={e => { this.setState({ txtName: e.target.value }) }} />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Điện thoại</span>
              <input className="ads-field__input" type="tel" value={this.state.txtPhone} onChange={e => { this.setState({ txtPhone: e.target.value }) }} />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Email</span>
              <input className="ads-field__input" type="email" autoComplete="email" value={this.state.txtEmail} onChange={e => { this.setState({ txtEmail: e.target.value }) }} />
            </label>
            <button className="ads-btn ads-btn--primary ads-btn--wide" type="submit">Đăng ký</button>
          </form>
          <p className="ads-auth__footer">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    );
  }
  // event-handlers
  btnSignupClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername;
    const password = this.state.txtPassword;
    const name = this.state.txtName;
    const phone = this.state.txtPhone;
    const email = this.state.txtEmail;
    if (username && password && name && phone && email) {
      const account = { username, password, name, phone, email };
      this.apiSignup(account);
    } else {
      alert('Please input username and password and name and phone and email');
    }
  }
  // apis
  apiSignup(account) {
    axios.post('/api/customer/signup', account).then(res => {
      const result = res.data;
      if (result.success === true) {
        alert('Đăng ký thành công!');
        this.props.navigate('/login');
        return;
      }
      alert(result.message || 'Đăng ký thất bại');
    }).catch((err) => {
      console.error(err);
      alert('Đăng ký thất bại');
    });
  }
}
export default withRouter(Signup);
