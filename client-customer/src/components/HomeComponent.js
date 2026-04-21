import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutBrand.css';

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newprods: [],
            about: null,
            hero: null,
            isMuted: false,
            volume: 0.8,
            emailNewsletter: '',
            newsletterSubscribed: false
        };
        this.videoRef = React.createRef();
    }
    componentDidMount() {
        this.apiGetNewProducts();
        this.apiGetAbout();
        this.apiGetHero();
        // Khởi tạo IntersectionObserver cho scroll animation
        this._observer = new IntersectionObserver(
            (entries) => entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('ab-visible');
            }),
            { threshold: 0.15 }
        );

        // Xử lý scroll nếu có hash trong URL
        if (window.location.hash) {
            setTimeout(() => {
                const id = window.location.hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }

    componentDidUpdate() {
        // Observe fade elements after render
        if (this._observer) {
            document.querySelectorAll('.ab-fade').forEach(el => {
                if (!el.classList.contains('ab-visible')) this._observer.observe(el);
            });
        }
    }

    componentWillUnmount() {
        if (this._observer) this._observer.disconnect();
    }

    // apis
    apiGetNewProducts() {
        axios.get('/api/customer/products/new').then((res) => {
            const result = res.data;
            this.setState({ newprods: result.slice(0, 4) });
        }).catch((err) => {
            console.error('Get products failed:', err.message);
        });
    }

    apiGetAbout() {
        axios.get('/api/customer/about').then((res) => {
            this.setState({ about: res.data });
        }).catch((err) => {
            console.error('Get about failed:', err.message);
        });
    }

    apiGetHero() {
        axios.get('/api/customer/hero').then((res) => {
            this.setState({ hero: res.data });
        }).catch((err) => {
            console.error('Get hero failed:', err.message);
        });
    }

    handleVolumeChange = (e) => {
        const volume = parseFloat(e.target.value);
        const isMuted = volume === 0;
        this.setState({ volume, isMuted });
        if (this.videoRef.current) {
            this.videoRef.current.volume = volume;
            this.videoRef.current.muted = isMuted;
            if (this.videoRef.current.paused) {
                this.videoRef.current.play().catch(e => console.error("Play failed:", e));
            }
        }
    };

    toggleMute = () => {
        const newMuted = !this.state.isMuted;
        this.setState({ isMuted: newMuted });
        if (this.videoRef.current) {
            this.videoRef.current.muted = newMuted;
            if (!newMuted && this.videoRef.current.paused) {
                this.videoRef.current.play().catch(e => console.error("Play failed:", e));
            }
        }
    };

    handleNewsletterSubmit = (e) => {
        e.preventDefault();
        if (this.state.emailNewsletter) {
            this.setState({ newsletterSubscribed: true });
            // Simulate API call
            console.log("Subscribed:", this.state.emailNewsletter);
        }
    };

    // Helper to get YouTube Embed URL
    getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            const videoId = match[2];
            // mute=0 to enable sound
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1&rel=0`;
        }
        return null;
    };

    render() {
        const about = this.state.about || {
            title: 'Câu Chuyện Của Mộc',
            description: 'Mộc-EcoPure ra đời từ sứ mệnh mang đến làn da khoẻ mạnh bằng công nghệ hiện đại — an toàn, bền vững và thân thiện với thiên nhiên.',
            image: '/moc-logo.png',
            logo: '',
            navbarLogo: '',
            philosophy: 'Ít hơn, nhưng tốt hơn.',
            mission: 'Mang trải nghiệm chăm sóc da chuẩn mực đến mọi nơi.',
            vision: 'Định nghĩa lại cách thế giới chăm sóc làn da.',
            values: 'Tinh giản. Chuẩn mực. Tinh tế. Đổi mới.',
            video: ''
        };
        const hero = this.state.hero || { video: '' };
        const ytEmbedUrl = this.getYouTubeEmbedUrl(hero.video);

        return (
            <div className="fig-layout">
                {/* 1. Hero Section */}
                <section className="fig-hero">
                    <div className="fig-container fig-hero-inner">
                        <div className="fig-hero-content">
                            <span className="fig-tag">✨ Công nghệ tiên tiến & phát triển bền vững</span>
                            <h1 className="fig-title-main">Mộc-EcoPure</h1>
                            <p className="fig-desc">Kết nối con người với thiên nhiên qua những sản phẩm thuần khiết, bền vững, được chế tác từ trái tim.</p>
                            <div className="fig-hero-actions">
                                <Link to="/skin-analysis" className="fig-btn" style={{ background: '#db9b91', color: 'white' }}>Soi Da AI ✨</Link>
                                <a href="#products" className="fig-btn fig-btn-primary">Khám Phá Ngay</a>
                                <a href="#story" className="fig-btn fig-btn-outline">Thương Hiệu</a>
                            </div>
                        </div>
                        <div className="fig-hero-art">
                            {ytEmbedUrl ? (
                                <div className="fig-hero-video-wrapper">
                                    <iframe 
                                        src={ytEmbedUrl}
                                        title="YouTube Hero Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="fig-hero-video"
                                        style={{ pointerEvents: 'none' }} // Prevent interaction for background effect
                                    />
                                </div>
                            ) : hero.video ? (
                                <div className="fig-hero-video-wrapper">
                                    <video 
                                        key={hero.video}
                                        ref={this.videoRef}
                                        src={hero.video} 
                                        autoPlay 
                                        loop 
                                        muted={false}
                                        playsInline
                                        className="fig-hero-video"
                                        onError={() => this.setState({ hero: { ...hero, video: '' } })} // Fallback to image on error
                                        onLoadedData={() => {
                                            if (this.videoRef.current) {
                                                this.videoRef.current.volume = this.state.volume;
                                                this.videoRef.current.muted = this.state.isMuted;
                                            }
                                        }}
                                    />
                                    <div className="fig-video-controls">
                                        <div className="fig-volume-control">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="1" 
                                                step="0.1" 
                                                value={this.state.isMuted ? 0 : this.state.volume} 
                                                onChange={this.handleVolumeChange}
                                                className="fig-volume-slider"
                                            />
                                        </div>
                                        <button 
                                            className="fig-video-mute-toggle"
                                            onClick={this.toggleMute}
                                            title={this.state.isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                                        >
                                            {this.state.isMuted ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9l-5 5H2v-4h2l5-5V21l-5-5"></path><path d="M17.07 16.93a5 5 0 0 0 0-7.07"></path><path d="M20.61 20.61a9 9 0 0 0 0-12.72"></path></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600" alt="Mộc EcoPure Nature" />
                            )}
                        </div>
                    </div>
                </section>

                {/* 2. Câu Chuyện Của Mộc – About Brand 2-cột */}
                <section id="story" className="ab-section">
                    <div className="ab-container">

                        {/* Cột trái: Văn bản */}
                        <div className="ab-left ab-fade">
                            <div className="ab-eyebrow">
                                <img src={about.navbarLogo || "/moc-logo.png"} alt="Mộc" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: '50%', background: '#3e5c2f', flexShrink: 0 }} /> Về Mộc-EcoPure
                            </div>

                            <h2 className="ab-title">
                                {about.title.split(' ').map((word, index) => (
                                    index === about.title.split(' ').length - 1 ? <em key={index}><br/>{word}</em> : word + ' '
                                ))}
                            </h2>

                            <p className="ab-desc">
                                {about.description || 'Mộc-EcoPure ra đời từ sứ mệnh mang đến làn da khoẻ mạnh bằng công nghệ hiện đại — an toàn, bền vững và thân thiện với thiên nhiên.'}
                            </p>

                            <div className="ab-features">
                                <div className="ab-feature">
                                    <div className="ab-feature__icon">⚡</div>
                                    <div className="ab-feature__body">
                                        <div className="ab-feature__name">Công nghệ hiện đại</div>
                                        <div className="ab-feature__sub">Sóng siêu âm &amp; RF thế hệ mới, hiệu quả vượt trội</div>
                                    </div>
                                </div>
                                <div className="ab-feature">
                                    <div className="ab-feature__icon">🛡️</div>
                                    <div className="ab-feature__body">
                                        <div className="ab-feature__name">Cá nhân hóa vẻ đẹp</div>
                                        <div className="ab-feature__sub">Hệ thống tự động nhận diện và đưa ra giải pháp tối ưu nhất cho từng tình trạng da</div>
                                    </div>
                                </div>
                            </div>

                            <a href="#products" className="ab-cta">
                                Khám phá sản phẩm
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>

                        {/* Cột phải: Media */}
                        <div className="ab-right ab-fade">
                            <div className="ab-deco ab-deco--1" />
                            <div className="ab-deco ab-deco--2" />
                            <div className="ab-img-wrap">
                                {about.video ? (
                                    <video
                                        src={about.video}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{ width: '100%', height: '420px', objectFit: 'contain', borderRadius: '28px', background: '#3e5c2f' }}
                                    />
                                ) : (
                                    <img
                                        src={about.image || '/moc-logo.png'}
                                        alt={about.title}
                                    />
                                )}
                            </div>
                        </div>

                    </div>
                </section>

                {/* 3. Triết Lý Brand Pillars */}
                <section id="philosophy" className="fig-pillars ab-fade">
                    <div className="fig-container">
                        <div className="fig-pillars-grid">
                            <div className="fig-pillar-item">
                                <span className="fig-pillar-label">Triết lý</span>
                                <h3 className="fig-pillar-text">{about.philosophy || 'Ít hơn, nhưng tốt hơn.'}</h3>
                            </div>
                            <div className="fig-pillar-item">
                                <span className="fig-pillar-label">Sứ mệnh</span>
                                <h3 className="fig-pillar-text">{about.mission || 'Mang trải nghiệm chăm sóc da chuẩn mực đến mọi nơi.'}</h3>
                            </div>
                            <div className="fig-pillar-item">
                                <span className="fig-pillar-label">Tầm nhìn</span>
                                <h3 className="fig-pillar-text">{about.vision || 'Định nghĩa lại cách thế giới chăm sóc làn da.'}</h3>
                            </div>
                            <div className="fig-pillar-item">
                                <span className="fig-pillar-label">Giá trị</span>
                                <h3 className="fig-pillar-text">{about.values || 'Tinh giản. Chuẩn mực. Tinh tế. Đổi mới.'}</h3>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Products Section */}
                <section id="products" className="fig-products">
                    <div className="fig-container">
                        <div className="fig-section-header">
                            <h2>Sản Phẩm Tinh Túy</h2>
                            <p>Khám phá bộ sưu tập sản phẩm được tuyển chọn kỹ lưỡng, mang đến trải nghiệm thuần khiết nhất.</p>
                        </div>
                        <div className="fig-grid-4">
                            {this.state.newprods.map(p => this.renderProductMiniCard(p))}
                            {this.state.newprods.length === 0 && (
                                <p style={{textAlign:"center", width: "100%", gridColumn: "span 4", color: "#6b7280"}}>Đang cập nhật sản phẩm...</p>
                            )}
                        </div>
                        <div style={{textAlign: "center", marginTop: "40px"}}>
                            <a href="/product/search/Khuyến mãi" className="fig-btn fig-btn-primary">Xem Tất Cả Sản Phẩm</a>
                        </div>
                    </div>
                </section>


                {/* 5. Newsletter Section */}
                <section className="fig-newsletter">
                    <div className="fig-container fig-news-inner">
                        <div className="fig-news-content">
                            <h2>Cùng Bắt Đầu Hành Trình Xanh</h2>
                            <p>Đăng ký nhận ưu đãi đặc biệt và cập nhật sản phẩm mới nhất từ Mộc-EcoPure</p>
                            
                            {this.state.newsletterSubscribed ? (
                                <div className="fig-news-success">
                                    <div className="fig-news-success-icon">🎉</div>
                                    <h3>Cảm ơn bạn đã đăng ký!</h3>
                                    <p>Chúng tôi sẽ gửi những thông tin ưu đãi mới nhất tới <strong>{this.state.emailNewsletter}</strong> sớm nhất.</p>
                                    <button onClick={() => this.setState({ newsletterSubscribed: false, emailNewsletter: '' })} className="fig-btn-reset">Đăng ký email khác</button>
                                </div>
                            ) : (
                                <form className="fig-news-form" onSubmit={this.handleNewsletterSubmit}>
                                    <input 
                                        type="email" 
                                        placeholder="Nhập email của bạn" 
                                        required 
                                        value={this.state.emailNewsletter}
                                        onChange={(e) => this.setState({ emailNewsletter: e.target.value })}
                                    />
                                    <button type="submit">Đăng Ký Ngay</button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    renderProductMiniCard(p) {
        return (
            <div className="fig-procard" key={p._id}>
                <div className="fig-procard-img">
                    <a href={"/product/" + p._id}>
                        <img src={"data:image/jpg;base64," + p.image} alt={p.name} />
                    </a>
                </div>
                <div className="fig-procard-body">
                    <div className="fig-cat">{p.category?.name || "Natural"}</div>
                    <a href={"/product/" + p._id} className="fig-name">{p.name}</a>
                    <div className="fig-price">{p.price.toLocaleString()}đ</div>
                </div>
            </div>
        );
    }
}
export default Home;
