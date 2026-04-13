import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../../contexts/MyContext';
import withRouter from '../../utils/withRouter';

class Header extends Component {
  static contextType = MyContext;

  render() {
    const { token, customer, mycart } = this.context;
    const cartCount = mycart ? mycart.length : 0;

    return (
      <header className="fig-header">
        <div className="fig-header-inner">
          <Link to="/home" className="fig-logo">
            <span className="fig-logo-icon">🌿</span>
            <span className="fig-logo-text">Mộc-EcoPure</span>
          </Link>

          <nav className="fig-nav">
            <a href="#story" className="fig-nav-link" onClick={(e) => this.scrollTo(e, 'story')}>Thương Hiệu</a>
            <a href="#products" className="fig-nav-link" onClick={(e) => this.scrollTo(e, 'products')}>Sản Phẩm</a>
            <a href="#philosophy" className="fig-nav-link" onClick={(e) => this.scrollTo(e, 'philosophy')}>Triết Lý</a>
          </nav>

          <div className="fig-actions">
            {token ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <Link to="/myprofile" className="fig-nav-link" style={{fontSize: 12}}>Hi, {customer && customer.name}</Link>
                    <button onClick={() => this.logout()} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#273e1c'}}>Đăng xuất</button>
                    <Link className="fig-btn-cart" to="/mycart">
                        <span className="fig-cart-icon">🛍️</span> Giỏ Hàng ({cartCount})
                    </Link>
                </div>
            ) : (
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <Link to="/login" className="fig-nav-link" style={{fontSize: 13, fontWeight: 600}}>Đăng nhập</Link>
                    <Link className="fig-btn-cart" to="/mycart">
                        <span className="fig-cart-icon">🛍️</span> Giỏ Hàng ({cartCount})
                    </Link>
                </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  scrollTo(e, id) {
    if (this.props.location.pathname !== '/home' && this.props.location.pathname !== '/') {
        return; // normal link behavior if not in home
    }
    e.preventDefault();
    const el = document.getElementById(id);
    if(el) {
        el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  logout() {
    this.context.setToken('');
    this.context.setCustomer(null);
    this.context.setMycart([]);
    this.props.navigate('/home');
  }
}
export default withRouter(Header);
