import axios from 'axios';
import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';

class Myprofile extends Component {
  static contextType = MyContext;
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
    if (this.context.token === '') return (<Navigate replace to='/login' />);
    return (
      <div className="ads-container">
        <div style={{ maxWidth: 480, margin: '40px auto' }}>
          <h2 className="ads-auth__title" style={{ textAlign: 'center', marginBottom: 32 }}>TÀI KHOẢN CỦA TÔI</h2>
          <form className="ads-auth__form" onSubmit={(e) => this.btnUpdateClick(e)}>
            
            <label className="ads-field">
              <span className="ads-field__label">TÊN ĐĂNG NHẬP</span>
              <input 
                className="ads-field__input" 
                type="text" 
                value={this.state.txtUsername} 
                onChange={e => { this.setState({ txtUsername: e.target.value }) }} 
                disabled
                style={{ background: '#f5f5f5', color: '#999', cursor: 'not-allowed' }}
              />
            </label>

            <label className="ads-field">
              <span className="ads-field__label">MẬT KHẨU</span>
              <input 
                className="ads-field__input" 
                type="password" 
                value={this.state.txtPassword} 
                onChange={e => { this.setState({ txtPassword: e.target.value }) }} 
              />
            </label>

            <label className="ads-field">
              <span className="ads-field__label">HỌ VÀ TÊN</span>
              <input 
                className="ads-field__input" 
                type="text" 
                value={this.state.txtName} 
                onChange={e => { this.setState({ txtName: e.target.value }) }} 
              />
            </label>

            <label className="ads-field">
              <span className="ads-field__label">SỐ ĐIỆN THOẠI</span>
              <input 
                className="ads-field__input" 
                type="tel" 
                value={this.state.txtPhone} 
                onChange={e => { this.setState({ txtPhone: e.target.value }) }} 
              />
            </label>

            <label className="ads-field">
              <span className="ads-field__label">EMAIL</span>
              <input 
                className="ads-field__input" 
                type="email" 
                value={this.state.txtEmail} 
                onChange={e => { this.setState({ txtEmail: e.target.value }) }} 
              />
            </label>

            <button className="ads-btn ads-btn--primary ads-btn--wide" style={{ marginTop: 24 }} type="submit">
              CẬP NHẬT THÔNG TIN
            </button>
          </form>
        </div>
      </div>
    );
  }
  componentDidMount() {
    if (this.context.customer) {
      this.setState({
        txtUsername: this.context.customer.username,
        txtPassword: this.context.customer.password,
        txtName: this.context.customer.name,
        txtPhone: this.context.customer.phone,
        txtEmail: this.context.customer.email
      });
    }
  }
  // event-handlers
  btnUpdateClick(e) {
    e.preventDefault();
    const username = this.state.txtUsername;
    const password = this.state.txtPassword;
    const name = this.state.txtName;
    const phone = this.state.txtPhone;
    const email = this.state.txtEmail;
    if (username && password && name && phone && email) {
      const customer = { username, password, name, phone, email };
      this.apiPutCustomer(this.context.customer._id, customer);
    } else {
      alert('Vui lòng điền đầy đủ các thông tin cần thiết!');
    }
  }
  // apis
  apiPutCustomer(id, customer) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/customer/customers/' + id, customer, config).then(res => {
      const result = res.data;
      if (result && result.success !== false) {
        alert('Cập nhật thông tin thành công!');
        this.context.setCustomer(result);
      } else {
        alert('Có lỗi xảy ra, vui lòng thử lại!');
      }
    });
  }
}
export default Myprofile;
