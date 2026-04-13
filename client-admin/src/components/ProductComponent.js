import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import ProductDetail from './ProductDetailComponent';

class Product extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      noPages: 0,
      curPage: 1,
      itemSelected: null,
      search: ''
    };
  }

  render() {
    const { products, noPages, curPage, itemSelected, search } = this.state;

    const filtered = search
      ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : products;

    const rows = filtered.map((item) => {
      const imgSrc = item.image
        ? (item.image.startsWith('http') || item.image.startsWith('data:')
          ? item.image : 'data:image/jpg;base64,' + item.image)
        : null;
      const isSelected = itemSelected && itemSelected._id === item._id;
// (Removed sizeBadges logic)
      return (
        <tr key={item._id} onClick={() => this.setState({ itemSelected: item })}
          style={{ background: isSelected ? 'var(--c-accent-glow)' : undefined }}>
          <td className="td-id">…{String(item._id).slice(-8)}</td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                background: 'var(--c-surface2)', border: '1px solid var(--c-border)'
              }}>
                {imgSrc
                  ? <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👕</div>}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{item.category?.name}</div>
              </div>
            </div>
          </td>
          <td style={{ fontWeight: 700, color: 'var(--c-green)', whiteSpace: 'nowrap' }}>
            {Number(item.price).toLocaleString('vi-VN')} ₫
          </td>
          <td style={{ fontWeight: 800 }}>{item.stock !== undefined ? item.stock : (item.totalStock || 0)}</td>
          <td className="muted">{new Date(item.cdate).toLocaleDateString('vi-VN')}</td>
        </tr>
      );
    });

    // Pagination
    const pages = Array.from({ length: noPages }, (_, i) => i + 1);

    return (
      <div className="panel-split" style={{ gridTemplateColumns: '1fr 420px' }}>
        {/* Left panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Danh sách sản phẩm</span>
            <span className="badge badge-gray">{products.length} / trang</span>
          </div>
          <div className="card-body" style={{ padding: '14px 0 0' }}>
            {/* Toolbar */}
            <div className="toolbar" style={{ padding: '0 20px 14px' }}>
              <div className="toolbar-search">
                <span className="toolbar-search__icon">🔍</span>
                <input
                  className="toolbar-search__input"
                  placeholder="Tìm sản phẩm..."
                  value={search}
                  onChange={(e) => this.setState({ search: e.target.value })}
                />
              </div>
              <button className="btn btn-ghost btn-sm"
                onClick={() => this.setState({ itemSelected: null })}>
                ✚ Thêm mới
              </button>
              <button className="btn btn-ghost btn-sm"
                onClick={() => this.apiGetProducts(curPage)}>
                ↺ Tải lại
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 48, color: 'var(--c-muted)' }}>
                        {search ? `Không tìm thấy sản phẩm "${search}"` : 'Chưa có sản phẩm nào'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {noPages > 1 && (
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--c-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--c-muted)', marginRight: 4 }}>Trang:</span>
                <div className="pagination">
                  <button className="page-btn" disabled={curPage === 1}
                    onClick={() => this.apiGetProducts(curPage - 1)}>‹</button>
                  {pages.map(p => (
                    <button key={p} className={`page-btn ${p === curPage ? 'active' : ''}`}
                      onClick={() => this.apiGetProducts(p)}>{p}</button>
                  ))}
                  <button className="page-btn" disabled={curPage === noPages}
                    onClick={() => this.apiGetProducts(curPage + 1)}>›</button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 'auto' }}>
                  Trang {curPage}/{noPages}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <ProductDetail
          item={itemSelected}
          curPage={curPage}
          updateProducts={this.updateProducts}
        />
      </div>
    );
  }

  componentDidMount() { this.apiGetProducts(this.state.curPage); }

  updateProducts = (products, noPages, selectedItem) => {
    const newState = { products, noPages };
    // If a selectedItem is explicitly passed, update itemSelected so the form reloads with fresh data
    if (selectedItem !== undefined) {
      newState.itemSelected = selectedItem;
    }
    this.setState(newState);
  }

  apiGetProducts(page) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/products?page=' + page, config).then((res) => {
      const result = res.data;
      this.setState({ products: result.products, noPages: result.noPages, curPage: result.curPage });
    }).catch((err) => {
      console.error('Get products failed:', err.message);
      this.setState({ products: [], noPages: 0, curPage: 1 });
    });
  }
}
export default Product;
