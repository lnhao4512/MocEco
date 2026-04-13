import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

const ALL_SIZES = []; // Unused but kept if any other files randomly import. Actually, let's remove ALL_SIZES if not exported. We'll just remove it and check if used.

class ProductDetail extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      txtID: '',
      txtName: '',
      txtPrice: '',
      cmbCategory: '',
      imgProduct: '',
      stock: 0,
      saving: false
    };
  }

  render() {
    const { txtID, txtName, txtPrice, cmbCategory, imgProduct, stock, saving } = this.state;
    const { categories } = this.state;
    const isEdit = !!txtID;

    const catOptions = categories.map(c => (
      <option key={c._id} value={c._id}>{c.name}</option>
    ));

    return (
      <div className="detail-panel" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
        {/* Title */}
        <div className="detail-panel__title">
          {isEdit ? '✏️ Sửa sản phẩm' : '✚ Thêm sản phẩm mới'}
        </div>

        {/* Image preview */}
        <div className="img-preview" onClick={() => document.getElementById('fileInput').click()}
          style={{ cursor: 'pointer', marginBottom: 16 }}>
          {imgProduct
            ? <img src={imgProduct} alt="preview" />
            : <div className="img-preview__placeholder">
                <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                <div>Click để chọn ảnh</div>
                <div style={{ fontSize: 11 }}>JPG, PNG, GIF</div>
              </div>}
          {imgProduct && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity .2s', color: '#fff', fontSize: 14
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >📷 Đổi ảnh</div>
          )}
        </div>
        <input id="fileInput" type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => this.previewImage(e)} />

        {/* Form */}
        {isEdit && (
          <div className="form-group">
            <label className="form-label">ID</label>
            <input className="form-input" value={txtID} readOnly />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Tên sản phẩm *</label>
          <input className="form-input" type="text" placeholder="VD: Áo Thun Nam Basic"
            value={txtName} onChange={(e) => this.setState({ txtName: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Giá cơ bản (₫) *</label>
          <input className="form-input" type="number" min="0" placeholder="VD: 299000"
            value={txtPrice} onChange={(e) => this.setState({ txtPrice: e.target.value })} />
          <span className="form-hint">Giá mặc định khi size không có giá riêng</span>
        </div>

        <div className="form-group">
          <label className="form-label">Danh mục *</label>
          <select className="form-select" value={cmbCategory}
            onChange={(e) => this.setState({ cmbCategory: e.target.value })}>
            <option value="">— Chọn danh mục (leaf) —</option>
            {catOptions}
          </select>
          <span className="form-hint">Chỉ hiển thị danh mục cấp cuối</span>
        </div>

        <div className="form-group">
          <label className="form-label">Tồn kho *</label>
          <input className="form-input" type="number" min="0" placeholder="0"
            value={stock} onChange={(e) => this.setState({ stock: e.target.value })} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {!isEdit && (
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving}
              onClick={() => this.btnAddClick()}>
              {saving ? '⏳ Đang lưu...' : '✚ Thêm mới'}
            </button>
          )}
          {isEdit && (
            <>
              <button className="btn btn-success" style={{ flex: 1 }} disabled={saving}
                onClick={() => this.btnUpdateClick()}>
                {saving ? '⏳...' : '💾 Lưu'}
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => this.btnDeleteClick()}>
                🗑 Xóa
              </button>
            </>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => this.reset()}>↺</button>
        </div>
      </div>
    );
  }

  componentDidMount() { this.apiGetCategories(); }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      if (!this.props.item) { this.reset(); return; }
      const item = this.props.item;
      // Fix: item.stock !== undefined prevents falsy-0 being treated as missing
      let stock = item.stock !== undefined ? item.stock : (item.totalStock || 0);
      const imgSrc = item.image
        ? (item.image.startsWith('http') || item.image.startsWith('data:')
          ? item.image : 'data:image/jpg;base64,' + item.image)
        : '';
      this.setState({
        txtID: item._id, txtName: item.name, txtPrice: item.price,
        cmbCategory: item.category?._id || '',
        imgProduct: imgSrc, stock
      });
    }
  }

  reset() {
    this.setState({
      txtID: '', txtName: '', txtPrice: '', cmbCategory: '', imgProduct: '',
      stock: 0
    });
  }

  previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => this.setState({ imgProduct: evt.target.result });
    reader.readAsDataURL(file);
  }

  validate() {
    const { txtName, txtPrice, cmbCategory, imgProduct } = this.state;
    if (!txtName.trim()) { alert('Vui lòng nhập tên sản phẩm'); return false; }
    if (!txtPrice || parseInt(txtPrice) <= 0) { alert('Vui lòng nhập giá hợp lệ'); return false; }
    if (!cmbCategory) { alert('Vui lòng chọn danh mục'); return false; }
    if (!imgProduct) { alert('Vui lòng chọn ảnh sản phẩm'); return false; }
    return true;
  }

  buildPayload() {
    const imgBase64 = this.state.imgProduct.replace(/^data:image\/[a-z]+;base64,/, '');
    let stockNum = parseInt(this.state.stock, 10);
    if (isNaN(stockNum)) stockNum = 0;
    return {
      name: this.state.txtName.trim(),
      price: parseInt(this.state.txtPrice),
      category: this.state.cmbCategory,
      image: imgBase64,
      stock: stockNum
    };
  }

  btnAddClick() {
    if (!this.validate()) return;
    this.setState({ saving: true });
    this.apiPostProduct(this.buildPayload());
  }
  btnUpdateClick() {
    if (!this.validate()) return;
    this.setState({ saving: true });
    this.apiPutProduct({ id: this.state.txtID, ...this.buildPayload() });
  }
  btnDeleteClick() {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    this.apiDeleteProduct(this.state.txtID);
  }

  apiPostProduct(prod) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.post('/api/admin/products', prod, config)
      .then(() => { this.setState({ saving: false }); this.reset(); this.apiRefreshProducts(); })
      .catch((err) => { this.setState({ saving: false }); alert('❌ ' + (err.response?.data?.message || err.message)); });
  }
  apiPutProduct(prod) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/admin/products', prod, config)
      .then(() => { this.setState({ saving: false }); this.apiRefreshProducts(); })
      .catch((err) => { this.setState({ saving: false }); alert('❌ ' + (err.response?.data?.message || err.message)); });
  }
  apiDeleteProduct(id) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.delete('/api/admin/products/' + id, config)
      .then(() => { this.reset(); this.apiRefreshProducts(); })
      .catch((err) => alert('❌ ' + err.message));
  }
  apiRefreshProducts() {
    const config = { headers: { 'x-access-token': this.context.token } };
    const currentId = this.state.txtID;
    axios.get('/api/admin/products?page=' + this.props.curPage, config).then((res) => {
      const result = res.data;
      const products = result.products || [];
      // After refresh, find the just-updated product and pass it back so itemSelected gets refreshed
      const updatedItem = products.find(p => String(p._id) === String(currentId)) || null;
      if (products.length !== 0) {
        this.props.updateProducts(products, result.noPages, updatedItem);
      } else {
        const prevPage = Math.max(1, this.props.curPage - 1);
        axios.get('/api/admin/products?page=' + prevPage, config).then((r) => {
          this.props.updateProducts(r.data.products, r.data.noPages, null);
        }).catch(() => this.props.updateProducts([], 0, null));
      }
    }).catch(() => this.props.updateProducts([], 0, null));
  }
  apiGetCategories() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/categories/leaves', config).then((res) => {
      this.setState({ categories: res.data });
    }).catch(() => this.setState({ categories: [] }));
  }
}
export default ProductDetail;
