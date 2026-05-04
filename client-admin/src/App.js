import './App.css';
import React, { Component } from 'react';
import MyProvider from './contexts/MyProvider';
import Login from './components/LoginComponent';
import Main from './components/MainComponent';
import { BrowserRouter } from 'react-router-dom'; // 1. Thêm import này

class App extends Component {
  render() {
    return (
      <MyProvider>
        <Login />
        <BrowserRouter> {/* 2. Bọc Main bằng BrowserRouter */}
          <Main />
        </BrowserRouter>
      </MyProvider>
    );
  }
}
export default App;