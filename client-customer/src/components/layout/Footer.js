import React, { Component } from 'react';

class Footer extends Component {
  render() {
    return (
      <footer className="fig-footer">
        <div className="fig-container fig-footer-grid">
            <div className="fig-foot-col">
                <div className="fig-logo">
                    <span className="fig-logo-icon">🌿</span>
                    <span className="fig-logo-text">Mộc-EcoPure</span>
                </div>
                <p className="fig-foot-motto">Sống thuần khiết, yêu thiên nhiên</p>
            </div>
            <div className="fig-foot-col">
                <h4 className="fig-foot-title">Về Chúng Tôi</h4>
                <a href="/home#story">Câu Chuyện</a>
                <a href="/home#philosophy">Triết Lý</a>
            </div>
            <div className="fig-foot-col">
                <h4 className="fig-foot-title">Sản Phẩm</h4>
                <a href="/product/search/Máy chăm sóc da">Máy chăm sóc da</a>
                <a href="/product/search/Chăm Sóc Mặt">Skincare</a>
                <a href="/product/search/Chăm Sóc Tóc">Haircare</a>
            </div>
            <div className="fig-foot-col">
                <h4 className="fig-foot-title">Liên Hệ</h4>
                <p>contact@mocecopure.vn</p>
                <p>+84 123 456 789</p>
                <p>Thành phố Hồ Chí Minh, Việt Nam</p>
            </div>
        </div>
        <div className="fig-footer-bottom">
            <p>© 2026 Mộc-EcoPure. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>
    );
  }
}
export default Footer;
