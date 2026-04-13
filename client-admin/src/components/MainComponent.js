import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import Menu from './MenuComponent';
import Home from './HomeComponent';
import Category from './CategoryComponent';
import Customer from './CustomerComponent';
import Product from './ProductComponent';
import Order from './OrderComponent';
import About from './AboutComponent';
import Landing from './LandingComponent';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/admin/home':     { title: 'Dashboard',   sub: 'Tổng quan hệ thống' },
  '/admin/product':  { title: 'Sản phẩm',    sub: 'Quản lý danh mục sản phẩm' },
  '/admin/category': { title: 'Danh mục',    sub: 'Phân cấp danh mục sản phẩm' },
  '/admin/order':    { title: 'Đơn hàng',    sub: 'Quản lý và xử lý đơn hàng' },
  '/admin/customer': { title: 'Khách hàng',  sub: 'Danh sách tài khoản khách hàng' },
  '/admin/about':    { title: 'Câu chuyện',  sub: 'Quản lý nội dung thương hiệu' },
  '/admin/landing':  { title: 'Trang chủ',   sub: 'Quản lý Video Hero trang chủ' },
};

function Topbar() {
  const location = useLocation();
  const info = PAGE_TITLES[location.pathname] || { title: 'Admin', sub: '' };
  const now = new Date().toLocaleDateString('vi-VN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  return (
    <header className="admin-topbar">
      <div>
        <div className="topbar-title">{info.title}</div>
        {info.sub && <div className="topbar-subtitle">{info.sub}</div>}
      </div>
      <div className="topbar-actions">
        <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{now}</span>
      </div>
    </header>
  );
}

class Main extends Component {
  static contextType = MyContext;
  render() {
    if (this.context.token !== '') {
      return (
        <div className="admin-layout">
          <Menu />
          <div className="admin-main">
            <Topbar />
            <div className="admin-content">
              <Routes>
                <Route path='/admin'          element={<Navigate replace to='/admin/home' />} />
                <Route path='/admin/home'     element={<Home />}     />
                <Route path='/admin/category' element={<Category />} />
                <Route path='/admin/product'  element={<Product />}  />
                <Route path='/admin/order'    element={<Order />}    />
                <Route path='/admin/customer' element={<Customer />} />
                <Route path='/admin/about'    element={<About />}    />
                <Route path='/admin/landing'  element={<Landing />}  />
              </Routes>
            </div>
          </div>
        </div>
      );
    }
    return <div />;
  }
}
export default Main;