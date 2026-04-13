import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';

class Menu extends Component {
    static contextType = MyContext;

    constructor(props) {
        super(props);
        this.state = {
            tree: [],           // nested tree từ /categories/tree
            txtKeyword: '',
            openMenuId: null,   // ID của root menu đang hover/open
            hoverNam: false,    // State cho menu cứng "Nam"
            about: null
        };
    }

    // Hàm scroll mượt mà
    scrollToSection = (id) => {
        // Nếu đang ở trang chủ thì scroll
        if (window.location.pathname === '/' || window.location.pathname === '/home') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                return true;
            }
        }
        return false; // Nếu không ở trang chủ, Link sẽ làm việc qua hash
    };

    handleLogout = () => {
        this.context.setToken('');
        this.context.setCustomer(null);
        this.context.setMycart([]);
        this.props.navigate('/home');
    };

    render() {
        const { about } = this.state;
        const { customer, mycart } = this.context;
        const displayLogo = about?.navbarLogo || about?.logo || about?.image;

        return (
            <header className="site-header">
                <nav className="nav-bar">
                    {/* Logo */}
                    <Link to="/" className="nav-logo">
                        {displayLogo ? (
                            <img src={displayLogo} alt="Mộc Logo" className="nav-logo__img" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div className="nav-logo__fallback" style={{ width: 32, height: 32, borderRadius: '50%', background: '#374d29', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px' }}>MỘC</div>
                        )}
                        <span className="nav-logo__text">Mộc-EcoPure</span>
                    </Link>

                    {/* Menu chính */}
                    <ul className="nav-list">
                        <li className="nav-item">
                            <Link className="nav-link" to="/#story" onClick={(e) => { if(this.scrollToSection('story')) e.preventDefault(); }}>THƯƠNG HIỆU</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/#products" onClick={(e) => { if(this.scrollToSection('products')) e.preventDefault(); }}>SẢN PHẨM</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/#philosophy" onClick={(e) => { if(this.scrollToSection('philosophy')) e.preventDefault(); }}>TRIẾT LÝ</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/skin-analysis" style={{ color: '#db9b91', fontWeight: 700 }}>SOI DA AI ✨</Link>
                        </li>

                        <li 
                            className="nav-item"
                            onMouseEnter={() => this.setState({ hoverNam: true })}
                            onMouseLeave={() => this.setState({ hoverNam: false })}
                        >
                            <span 
                                className="nav-link nav-link--parent"
                                style={{ 
                                    background: this.state.hoverNam ? '#f3f4f6' : 'transparent', 
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}
                            >
                                CHĂM SÓC CƠ THỂ
                            </span>
                            
                            {this.state.hoverNam && (
                                <div className="dropdown-mega">
                                    <div className="dropdown-mega__inner">
                                        <div className="dropdown-cols">
                                            <div className="dropdown-col">
                                                <span className="dropdown-title">CHĂM SÓC TÓC</span>
                                                <ul className="dropdown-list">
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Dầu gội thảo dược">Dầu gội thảo dược</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Dầu xả tự nhiên">Dầu xả tự nhiên</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Tinh dầu bưởi">Tinh dầu bưởi</Link></li>
                                                </ul>
                                            </div>
                                            <div className="dropdown-col">
                                                <span className="dropdown-title">CHĂM SÓC MẶT</span>
                                                <ul className="dropdown-list">
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Sữa rửa mặt hữu cơ">Sữa rửa mặt hữu cơ</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Toner hoa hồng">Toner hoa hồng</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Mặt nạ đất sét">Mặt nạ đất sét</Link></li>
                                                </ul>
                                            </div>
                                            <div className="dropdown-col">
                                                <span className="dropdown-title">DƯỠNG THỂ</span>
                                                <ul className="dropdown-list">
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Sữa tắm thiên nhiên">Sữa tắm thiên nhiên</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Lotion trà xanh">Lotion trà xanh</Link></li>
                                                    <li className="dropdown-item"><Link className="dropdown-link" to="/product/search/Tẩy tế bào chết cafe">Tẩy tế bào chết cafe</Link></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </li>
                    </ul>

                    {/* Search bar & Actions */}
                    <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <form className="nav-search" onSubmit={(e) => { e.preventDefault(); this.props.navigate('/product/search/' + this.state.txtKeyword); }}>
                            <input
                                type="search"
                                placeholder="Tìm kiếm..."
                                className="nav-search__input"
                                value={this.state.txtKeyword}
                                onChange={(e) => this.setState({ txtKeyword: e.target.value })}
                            />
                            <button type="submit" className="nav-search__btn">🔍</button>
                        </form>
                        
                        {customer ? (
                            <div className="nav-user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Link to="/myprofile" style={{ fontSize: '12px', fontWeight: 600, color: '#374d29', textDecoration: 'none' }}>Hi, {customer.name}</Link>
                                <span onClick={this.handleLogout} style={{ fontSize: '11px', cursor: 'pointer', color: '#db9b91' }}>Đăng xuất</span>
                            </div>
                        ) : (
                            <Link to="/login" className="nav-link" style={{ fontSize: '12px', fontWeight: 600 }}>Đăng nhập</Link>
                        )}

                        <Link to="/mycart" className="nav-cart-btn">
                             <span className="nav-cart-icon">🛒</span> Giỏ ({mycart.length})
                        </Link>
                    </div>
                </nav>
            </header>
        );
    }

    componentDidMount() {
        this.apiGetAbout();
    }

    apiGetAbout() {
        axios.get('/api/customer/about').then((res) => {
            this.setState({ about: res.data });
        }).catch((err) => {
            console.error('Get about in menu failed:', err.message);
        });
    }
}

export default withRouter(Menu);
