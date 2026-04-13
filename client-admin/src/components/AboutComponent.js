import axios from 'axios';
import React, { Component } from 'react';
import MyContext from '../contexts/MyContext';

class About extends Component {
  static contextType = MyContext; // using this.context to get token
  
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      description: '',
      image: '',
      logo: '',
      navbarLogo: '',
      video: '',
      philosophy: '',
      mission: '',
      vision: '',
      values: '',
      previewImage: '',
      previewLogo: '',
      previewNavbarLogo: '',
      previewVideo: '',
      saving: false,
      message: ''
    };
  }

  componentDidMount() {
    this.apiGetAbout();
  }

  // apis
  apiGetAbout() {
    const config = { headers: { 'x-access-token': this.context.token } };
    axios.get('/api/admin/about', config).then((res) => {
      const result = res.data;
      if (result) {
        this.setState({
          title: result.title || '',
          description: result.description || '',
          image: result.image || '',
          logo: result.logo || '',
          navbarLogo: result.navbarLogo || '',
          video: result.video || '',
          philosophy: result.philosophy || '',
          mission: result.mission || '',
          vision: result.vision || '',
          values: result.values || '',
          previewImage: result.image ? result.image : '',
          previewLogo: result.logo ? result.logo : '',
          previewNavbarLogo: result.navbarLogo ? result.navbarLogo : '',
          previewVideo: result.video ? result.video : ''
        });
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  apiUpdateAbout() {
    this.setState({ saving: true, message: '' });
    const config = { headers: { 'x-access-token': this.context.token } };
    const body = {
      title: this.state.title,
      description: this.state.description,
      image: this.state.image,
      logo: this.state.logo,
      navbarLogo: this.state.navbarLogo,
      video: this.state.video,
      philosophy: this.state.philosophy,
      mission: this.state.mission,
      vision: this.state.vision,
      values: this.state.values
    };
    axios.put('/api/admin/about', body, config).then((res) => {
      this.setState({ saving: false });
      const result = res.data;
      if (result.success) {
        alert('Cập nhật thành công!');
        this.setState({ message: 'Cập nhật thành công!' });
      } else {
        alert('Cập nhật thất bại!');
      }
    }).catch((err) => {
      this.setState({ saving: false });
      console.error(err);
    });
  }

  // handers
  handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setState({ image: e.target.result, previewImage: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setState({ logo: e.target.result, previewLogo: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  handleNavbarLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setState({ navbarLogo: e.target.result, previewNavbarLogo: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        alert('Video quá lớn! Vui lòng chọn clip dưới 15MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.setState({ video: e.target.result, previewVideo: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  render() {
    return (
      <div className="inner-responsive" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', color: '#374d29', marginBottom: '30px' }}>QUẢN LÝ THƯƠNG HIỆU & NỘI DUNG</h2>
        <form onSubmit={(e) => { e.preventDefault(); this.apiUpdateAbout(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Cột 1: Thông tin cơ bản & Logo */}
            <div>
              <h3 style={{ borderBottom: '2px solid #374d29', paddingBottom: '10px', color: '#374d29' }}>Cơ Bản & Logo</h3>
              <table className="datatable" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Logo Navbar</td>
                    <td>
                      <input type="file" accept="image/*" onChange={this.handleNavbarLogoChange} />
                      {this.state.previewNavbarLogo && <img src={this.state.previewNavbarLogo} alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '50%', marginTop: '5px' }} />}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Tên Thương Hiệu</td>
                    <td><input type="text" value={this.state.title} onChange={(e) => this.setState({ title: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Mô tả</td>
                    <td><textarea rows="4" value={this.state.description} onChange={(e) => this.setState({ description: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Ảnh/Video chính</td>
                    <td>
                      <input type="file" accept="image/*" onChange={this.handleImageChange} style={{ marginBottom: '5px' }} />
                      <input type="file" accept="video/*" onChange={this.handleVideoChange} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cột 2: Triết lý & Tầm nhìn */}
            <div>
              <h3 style={{ borderBottom: '2px solid #374d29', paddingBottom: '10px', color: '#374d29' }}>Triết Lý & Tầm Nhìn</h3>
              <table className="datatable" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '100px', fontWeight: 'bold' }}>Triết lý</td>
                    <td><textarea rows="2" value={this.state.philosophy} onChange={(e) => this.setState({ philosophy: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Sứ mệnh</td>
                    <td><textarea rows="2" value={this.state.mission} onChange={(e) => this.setState({ mission: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Tầm nhìn</td>
                    <td><textarea rows="2" value={this.state.vision} onChange={(e) => this.setState({ vision: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Giá trị</td>
                    <td><textarea rows="2" value={this.state.values} onChange={(e) => this.setState({ values: e.target.value })} style={{ width: '100%' }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" disabled={this.state.saving} 
              style={{ padding: '12px 50px', background: '#374d29', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {this.state.saving ? 'ĐANG LƯU...' : 'LƯU TẤT CẢ THAY ĐỔI'}
            </button>
          </div>
        </form>
      </div>
    );
  }
}

export default About;
