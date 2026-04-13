import axios from 'axios';
import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import MyContext from '../contexts/MyContext';

class ProductDetail extends Component {
    static contextType = MyContext;
    constructor(props) {
        super(props);
        this.state = {
            product: null,
            txtQuantity: 1
        };
    }

    // ── Tính giá hiển thị ───────────────────────────────
    getDisplayPrice() {
        const { product } = this.state;
        if (!product) return 0;
        return product.price;
    }

    render() {
        const prod = this.state.product;
        if (!prod) return <div />;

        const imgSrc = prod.image
            ? (prod.image.startsWith('http') || prod.image.startsWith('data:')
                ? prod.image
                : 'data:image/jpg;base64,' + prod.image)
            : '';
        const displayPrice = this.getDisplayPrice();
        const stock = prod.stock !== undefined ? prod.stock : (prod.totalStock || 0);

        return (
            <div className="ads-container ads-pdp">
                <div className="ads-pdp__grid">
                    {/* Ảnh */}
                    <div className="ads-pdp__media">
                        <img className="ads-pdp__img" src={imgSrc} alt={prod.name || 'Product'} />
                    </div>

                    {/* Info */}
                    <div className="ads-pdp__info">
                        <div className="ads-pdp__cat">{prod.category && prod.category.name}</div>
                        <h2 className="ads-pdp__name">{prod.name}</h2>

                        <div className="ads-pdp__price">{Number(displayPrice).toLocaleString('vi-VN')} ₫</div>

                        {/* Stock tổng */}
                        <div className="pdp-stock">
                            {stock > 0
                                ? <><span className="pdp-stock__dot pdp-stock__dot--in" /> Còn hàng ({stock} sản phẩm)</>
                                : <><span className="pdp-stock__dot pdp-stock__dot--out" /> Hết hàng</>}
                        </div>

                        {/* Form add to cart */}
                        <form className="ads-pdp__form" onSubmit={(e) => this.btnAdd2CartClick(e)}>
                            <label className="ads-field">
                                <span className="ads-field__label">Số lượng</span>
                                <input
                                    className="ads-field__input"
                                    type="number" min="1" max="99"
                                    value={this.state.txtQuantity}
                                    onChange={(e) => this.setState({ txtQuantity: e.target.value })}
                                />
                            </label>
                            <button
                                className="ads-btn ads-btn--primary ads-btn--wide"
                                type="submit"
                                disabled={stock === 0}
                            >
                                {stock === 0 ? '⚠ Hết hàng' : '🛒 Thêm vào giỏ'}
                            </button>
                        </form>

                        {/* Meta */}
                        <div className="ads-pdp__meta">
                            <div><b>ID</b>: {prod._id}</div>
                            <div><b>Danh mục</b>: {prod.category && prod.category.name}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    componentDidMount() {
        const params = this.props.params;
        this.apiGetProduct(params.id);
    }

    apiGetProduct(id) {
        axios.get('/api/customer/products/' + id).then((res) => {
            this.setState({ product: res.data });
        }).catch(() => this.setState({ product: null }));
    }

    btnAdd2CartClick(e) {
        e.preventDefault();
        const { product, txtQuantity } = this.state;
        const quantity = parseInt(txtQuantity);
        if (!quantity || quantity < 1) {
            alert('Vui lòng nhập số lượng hợp lệ');
            return;
        }

        const stock = product.stock !== undefined ? product.stock : (product.totalStock || 0);
        if (quantity > stock) {
            alert(`⚠ Số lượng vượt quá tồn kho! Chỉ còn ${stock} sản phẩm.`);
            return;
        }

        const mycart = [...this.context.mycart];
        const cartKey = product._id;
        const index = mycart.findIndex(x => x.cartKey === cartKey);

        const cartItem = {
            cartKey,
            product,
            quantity,
            unitPrice: this.getDisplayPrice()
        };

        if (index === -1) {
            mycart.push(cartItem);
        } else {
            mycart[index].quantity += quantity;
        }

        // Nếu đã đăng nhập, gọi API lưu Cart lên MongoDB
        if (this.context.customer) {
            const body = {
                userId: this.context.customer._id,
                productId: product._id,
                quantity: quantity,
                price: this.getDisplayPrice()
            };
            const config = { headers: { 'x-access-token': this.context.token } };
            axios.post('/api/customer/cart/add', body, config).then(() => {
                this.context.setMycart(mycart);
                this.props.navigate('/mycart');
            }).catch(err => {
                console.error("Cart API err", err);
                // Fallback to local cart
                this.context.setMycart(mycart);
                this.props.navigate('/mycart');
            });
        } else {
            this.context.setMycart(mycart);
            this.props.navigate('/mycart');
        }
    }
}

export default withRouter(ProductDetail);
