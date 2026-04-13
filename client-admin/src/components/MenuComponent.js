import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin/home',     icon: '⊞', label: 'Dashboard' },
  { to: '/admin/product',  icon: '👕', label: 'Sản phẩm'  },
  { to: '/admin/category', icon: '📂', label: 'Danh mục'  },
  { to: '/admin/order',    icon: '📦', label: 'Đơn hàng'  },
  { to: '/admin/customer', icon: '👥', label: 'Khách hàng' },
  { to: '/admin/about',    icon: '📖', label: 'Câu chuyện' },
  { to: '/admin/landing',  icon: '🏠', label: 'Trang chủ' },
];

// Wrapper để dùng hook useLocation trong class component
function SidebarInner({ username, onLogout }) {
  const location = useLocation();
  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand__icon">🌿</div>
        <div>
          <div className="sidebar-brand__name">Mộc-EcoPure</div>
          <div className="sidebar-brand__sub">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <div className="sidebar-section__label">Menu chính</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={['sidebar-link', location.pathname === item.to ? 'active' : ''].join(' ')}
            >
              <span className="sidebar-link__icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="sidebar-user__avatar">
          {username ? username.charAt(0).toUpperCase() : 'A'}
        </div>
        <div>
          <div className="sidebar-user__name">{username || 'Admin'}</div>
          <div className="sidebar-user__role">Quản trị viên</div>
        </div>
        <button className="sidebar-user__logout" title="Đăng xuất" onClick={onLogout}>
          ⏻
        </button>
      </div>
    </aside>
  );
}

class Menu extends Component {
  static contextType = MyContext;
  render() {
    return (
      <SidebarInner
        username={this.context.username}
        onLogout={() => {
          this.context.setToken('');
          this.context.setUsername('');
        }}
      />
    );
  }
}
export default Menu;