import './App.css';
import React, { Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Main from './components/MainComponent';
import MyProvider from './contexts/MyProvider';

class App extends Component {
  render() {
    return (
      <MyProvider>
        <BrowserRouter>
          <div style={{ pointerEvents: 'none', filter: 'blur(5px)', userSelect: 'none' }}>
            <Main />
          </div>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 999999999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 15px 40px rgba(0,0,0,0.5)',
              textAlign: 'center',
              maxWidth: '800px',
              width: '100%'
            }}>
              <h1 style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: '20px', fontWeight: 'bold', lineHeight: '1.2' }}>
                💔 Trang web tụi mình xin dừng hoạt động.
              </h1>
              <p style={{ fontSize: '1.25rem', color: '#444', lineHeight: '1.6', margin: 0 }}>
                Cảm ơn bạn đã từng ghé và trải nghiệm, chúc bạn có 1 ngày tốt lành và thành công !
              </p>
            </div>
          </div>
        </BrowserRouter>
      </MyProvider>
    );
  }
}
export default App;
