import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';
import CategoryDetail from './CategoryDetailComponent';

class Category extends Component {
  static contextType = MyContext;
  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      treeRows: [],
      itemSelected: null,
      search: ''
    };
  }

  render() {
    const { treeRows, itemSelected, search } = this.state;

    const filtered = search
      ? treeRows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
      : treeRows;

    const depthLabel = (d) => {
      if (d === 0) return <span className="badge badge-purple">📁 Root</span>;
      if (d === 1) return <span className="badge badge-blue">📂 Cấp 2</span>;
      return <span className="badge badge-green">📄 Leaf</span>;
    };

    const rows = filtered.map((item) => {
      const pad = Array(item.depth).fill('    ').join('');
      const isSelected = itemSelected && itemSelected._id === item._id;
      return (
        <tr
          key={item._id}
          onClick={() => this.trItemClick(item)}
          style={{ background: isSelected ? 'var(--c-accent-glow)' : undefined }}
        >
          <td className="td-id">…{String(item._id).slice(-8)}</td>
          <td>
            <span style={{ whiteSpace: 'pre', color: 'var(--c-border2)' }}>{pad}</span>
            <span style={{
              fontWeight: item.depth === 0 ? 700 : item.depth === 1 ? 600 : 400,
              color: item.depth === 0 ? 'var(--c-text)' : item.depth === 1 ? 'var(--c-muted2)' : 'var(--c-muted)'
            }}>
              {item.name}
            </span>
          </td>
          <td className="muted">
            {item.parentId
              ? <span className="td-id">…{String(item.parentId).slice(-8)}</span>
              : <span style={{ color: 'var(--c-border2)', fontStyle: 'italic', fontSize: 12 }}>root</span>}
          </td>
          <td>{depthLabel(item.depth)}</td>
        </tr>
      );
    });

    return (
      <div className="panel-split" style={{ gridTemplateColumns: '1fr 360px' }}>
        {/* Left: tree table */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cây danh mục</span>
            <div className="flex gap-2">
              <span className="badge badge-gray">{treeRows.length} danh mục</span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '14px 0 0' }}>
            {/* Toolbar */}
            <div className="toolbar" style={{ padding: '0 20px 14px' }}>
              <div className="toolbar-search">
                <span className="toolbar-search__icon">🔍</span>
                <input
                  className="toolbar-search__input"
                  placeholder="Tìm danh mục..."
                  value={search}
                  onChange={(e) => this.setState({ search: e.target.value })}
                />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => this.setState({ itemSelected: null })}>
                ✚ Thêm mới
              </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, padding: '0 20px 14px', fontSize: 12, color: 'var(--c-muted)' }}>
              <span><span className="badge badge-purple" style={{ fontSize: 10 }}>Root</span> Cấp 1</span>
              <span><span className="badge badge-blue" style={{ fontSize: 10 }}>Cấp 2</span> Danh mục con</span>
              <span><span className="badge badge-green" style={{ fontSize: 10 }}>Leaf</span> Gắn sản phẩm</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Parent ID</th>
                    <th>Cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? rows : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--c-muted)', padding: 40 }}>
                        {search ? `Không tìm thấy "${search}"` : 'Chưa có danh mục nào'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: detail */}
        <CategoryDetail
          item={itemSelected}
          categories={this.state.categories}
          updateCategories={this.updateCategories}
        />
      </div>
    );
  }

  flattenTree(nodes, depth = 0, result = []) {
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        this.flattenTree(node.children, depth + 1, result);
      }
    }
    return result;
  }

  updateCategories = (categories) => {
    this.setState({ categories });
    const buildTree = (list, parentId = null) =>
      list
        .filter((c) => String(c.parentId || null) === String(parentId))
        .map((c) => ({ ...c, children: buildTree(list, c._id) }));
    const treeRows = this.flattenTree(buildTree(categories));
    this.setState({ treeRows });
  }

  componentDidMount() { this.apiGetCategories(); }
  trItemClick(item) { this.setState({ itemSelected: item }); }

  apiGetCategories() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/categories', config).then((res) => {
      this.updateCategories(res.data);
    }).catch(() => this.setState({ categories: [], treeRows: [] }));
  }
}
export default Category;