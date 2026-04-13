import axios from 'axios';
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../utils/withRouter';

function idToString(id) {
  if (id == null) return '';
  if (typeof id === 'object' && id.toString) return id.toString();
  return String(id);
}

class Active extends Component {
  constructor(props) {
    super(props);
    this.state = {
      txtID: '',
      txtToken: '',
      banner: ''
    };
  }

  componentDidMount() {
    const { location } = this.props;
    const st = (location && location.state) || {};
    const params = new URLSearchParams((location && location.search) || '');
    const qId = params.get('id') || '';
    const qToken = params.get('token') || '';

    this.setState({
      txtID: idToString(st.accountId || qId || ''),
      txtToken: st.activationKey || qToken || '',
      banner: st.message || (st.pendingActivation ? 'Nhập Account ID và mã kích hoạt (key) để kích hoạt, sau đó bạn mới đăng nhập được.' : '')
    });
  }

  componentDidUpdate(prevProps) {
    const loc = this.props.location;
    const prevLoc = prevProps.location;
    if (loc !== prevLoc && loc && loc.state && loc.state.accountId) {
      const st = loc.state;
      this.setState({
        txtID: idToString(st.accountId || ''),
        txtToken: st.activationKey || '',
        banner: st.message || ''
      });
    }
  }

  render() {
    return (
      <div className="ads-container ads-auth">
        <div className="ads-auth__card">
          <h1 className="ads-auth__title">Kích hoạt tài khoản</h1>
          <p className="ads-auth__hint">
            Tài khoản mới đăng ký ở trạng thái <strong>chưa kích hoạt</strong>. Nhập <strong>Account ID</strong> và <strong>mã kích hoạt (key)</strong> đã gửi qua email hoặc hiển thị sau khi đăng ký.
          </p>
          {this.state.banner ? (
            <div className="ads-auth__banner" role="status">
              {this.state.banner}
            </div>
          ) : null}
          <form className="ads-auth__form" onSubmit={(e) => this.btnActiveClick(e)}>
            <label className="ads-field">
              <span className="ads-field__label">Account ID</span>
              <input
                className="ads-field__input"
                type="text"
                autoComplete="off"
                placeholder="Dán ID tài khoản"
                value={this.state.txtID}
                onChange={(e) => this.setState({ txtID: e.target.value })}
              />
            </label>
            <label className="ads-field">
              <span className="ads-field__label">Mã kích hoạt (key)</span>
              <input
                className="ads-field__input"
                type="text"
                autoComplete="off"
                placeholder="Nhập mã kích hoạt"
                value={this.state.txtToken}
                onChange={(e) => this.setState({ txtToken: e.target.value })}
              />
            </label>
            <button className="ads-btn ads-btn--primary ads-btn--wide" type="submit">
              Kích hoạt
            </button>
          </form>
          <p className="ads-auth__footer">
            <Link to="/login">Đăng nhập</Link>
            {' · '}
            <Link to="/signup">Đăng ký</Link>
          </p>
        </div>
      </div>
    );
  }

  btnActiveClick(e) {
    e.preventDefault();
    const id = (this.state.txtID || '').trim();
    const token = (this.state.txtToken || '').trim();
    if (id && token) {
      this.apiActive(id, token);
    } else {
      alert('Vui lòng nhập Account ID và mã kích hoạt');
    }
  }

  apiActive(id, token) {
    const body = { id, token };
    axios.post('/api/customer/active', body).then((res) => {
      const result = res.data;
      if (result && (result.active === 1 || result.active === '1' || result._id)) {
        this.props.navigate('/login', {
          state: {
            activationSuccess: true,
            message: 'Kích hoạt thành công. Bạn có thể đăng nhập.'
          }
        });
      } else {
        alert('Kích hoạt thất bại: sai Account ID hoặc mã kích hoạt.');
      }
    }).catch((err) => {
      console.error('Active account failed:', err.message);
      alert('Kích hoạt thất bại');
    });
  }
}

export default withRouter(Active);
