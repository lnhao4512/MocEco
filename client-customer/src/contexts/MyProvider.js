import React, { Component } from 'react';
import MyContext from './MyContext';

class MyProvider extends Component {
  constructor(props) {
    super(props);
    
    // Khôi phục session từ storage nếu có
    const savedToken = localStorage.getItem('token') || '';
    const savedCustomer = localStorage.getItem('customer') ? JSON.parse(localStorage.getItem('customer')) : null;
    const savedCart = localStorage.getItem('mycart') ? JSON.parse(localStorage.getItem('mycart')) : [];

    this.state = {
      token: savedToken,
      customer: savedCustomer,
      mycart: savedCart,
      setToken: this.setToken,
      setCustomer: this.setCustomer,
      setMycart: this.setMycart
    };
  }

  setToken = value => {
    this.setState({ token: value });
    if (value) {
      localStorage.setItem('token', value);
    } else {
      localStorage.removeItem('token');
    }
  }

  setCustomer = value => {
    this.setState({ customer: value });
    if (value) {
      localStorage.setItem('customer', JSON.stringify(value));
    } else {
      localStorage.removeItem('customer');
    }
  }

  setMycart = value => {
    this.setState({ mycart: value });
    localStorage.setItem('mycart', JSON.stringify(value));
  }

  render() {
    return (
      <MyContext.Provider value={this.state}>
        {this.props.children}
      </MyContext.Provider>
    );
  }
}

export default MyProvider;
