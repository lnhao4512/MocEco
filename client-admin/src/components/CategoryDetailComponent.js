import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class CategoryDetail extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = { txtID: '', txtName: '', cmbParent: '' };
  }

  buildDropdown(categories) {
    const buildTree = (list, parentId = null) =>
      list
        .filter((c) => String(c.parentId || null) === String(parentId))
        .map((c) => ({ ...c, children: buildTree(list, c._id) }));

    const renderOptions = (nodes, depth = 0) => {
      const opts = [];
      for (const node of nodes) {
        const pad = '\u00A0\u00A0\u00A0\u00A0'.repeat(depth);
        const icon = depth === 0 ? '📁 ' : depth === 1 ? '📂 ' : '📄 ';
        opts.push(<option key={node._id} value={node._id}>{pad}{icon}{node.name}</option>);
        if (node.children?.length) opts.push(...renderOptions(node.children, depth + 1));
      }
      return opts;
    };
    return renderOptions(buildTree(categories));
  }

  render() {
    const { categories = [] } = this.props;
    const { txtID, txtName, cmbParent } = this.state;
    const isEdit = !!txtID;

    return (
      <div className="detail-panel">
        <div className="detail-panel__title">
          {isEdit ? `✏️ Sửa danh mục` : '✚ Thêm danh mục mới'}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          {isEdit && (
            <div className="form-group">
              <label className="form-label">ID</label>
              <input className="form-input" type="text" value={txtID} readOnly />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tên danh mục *</label>
            <input
              className="form-input"
              type="text"
              placeholder="VD: Áo thun, Quần jean..."
              value={txtName}
              onChange={(e) => this.setState({ txtName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Danh mục cha</label>
            <select
              className="form-select"
              value={cmbParent}
              onChange={(e) => this.setState({ cmbParent: e.target.value })}
            >
              <option value="">— Root (không có cha) —</option>
              {this.buildDropdown(categories)}
            </select>
            <span className="form-hint">
              {cmbParent
                ? `Cha: ${categories.find(c => String(c._id) === cmbParent)?.name}`
                : 'Để trống = danh mục cấp 1'}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {!isEdit && (
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => this.btnAddClick()}>
                ✚ Thêm mới
              </button>
            )}
            {isEdit && (
              <>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={() => this.btnUpdateClick()}>
                  💾 Lưu
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => this.btnDeleteClick()}>
                  🗑 Xóa
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => this.reset()}>
              ↺ Reset
            </button>
          </div>
        </form>
      </div>
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.item !== prevProps.item) {
      if (!this.props.item) {
        this.reset();
      } else {
        const item = this.props.item;
        this.setState({
          txtID:     item._id,
          txtName:   item.name,
          cmbParent: item.parentId ? String(item.parentId) : ''
        });
      }
    }
  }

  reset() { this.setState({ txtID: '', txtName: '', cmbParent: '' }); }

  btnAddClick() {
    const { txtName, cmbParent } = this.state;
    if (!txtName.trim()) { alert('Vui lòng nhập tên danh mục'); return; }
    this.apiPostCategory({ name: txtName.trim(), parentId: cmbParent || null });
  }
  btnUpdateClick() {
    const { txtID, txtName, cmbParent } = this.state;
    if (!txtName.trim()) { alert('Vui lòng nhập tên danh mục'); return; }
    this.apiPutCategory({ _id: txtID, name: txtName.trim(), parentId: cmbParent || null });
  }
  btnDeleteClick() {
    if (!window.confirm('Xác nhận xóa danh mục này?')) return;
    this.apiDeleteCategory(this.state.txtID);
  }

  apiPostCategory(cat) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.post('/api/admin/categories', cat, config).then(() => {
      this.reset(); this.apiGetCategories();
    }).catch((err) => alert('❌ ' + (err.response?.data?.message || err.message)));
  }
  apiPutCategory(cat) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.put('/api/admin/categories/' + cat._id, cat, config).then(() => {
      this.reset(); this.apiGetCategories();
    }).catch((err) => alert('❌ ' + (err.response?.data?.message || err.message)));
  }
  apiDeleteCategory(id) {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.delete('/api/admin/categories/' + id, config).then(() => {
      this.reset(); this.apiGetCategories();
    }).catch((err) => alert('❌ ' + (err.response?.data?.message || err.message)));
  }
  apiGetCategories() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/categories', config).then((res) => {
      this.props.updateCategories(res.data);
    }).catch(() => {});
  }
}
export default CategoryDetail;