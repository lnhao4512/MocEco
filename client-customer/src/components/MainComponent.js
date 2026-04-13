import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Home from './HomeComponent';
import Product from './ProductComponent';
import ProductDetail from './ProductDetailComponent';
import Signup from './SignupComponent';
import Login from './LoginComponent';
import Myprofile from './MyprofileComponent';
import Mycart from './MycartComponent';
import Myorders from './MyordersComponent';
import CheckoutPage from './CheckoutPage';
import CheckoutSuccess from './CheckoutSuccess';
import SkinAnalysis from './SkinAnalysisComponent';

class Main extends Component {
    render() {
        return (
            <div className="ads-app">
                <Header />
                <main className="ads-main">
                <Routes>
                    <Route path='/' element={<Navigate replace to='/home' />} />
                    <Route path='/home' element={<Home />} />
                    <Route path='/product/category/:cid' element={<Product />} />
                    <Route path='/product/search/:keyword' element={<Product />} />
                    <Route path='/product/:id' element={<ProductDetail />} />
                    <Route path='/signup' element={<Signup />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/myprofile' element={<Myprofile />} />
                    <Route path='/mycart' element={<Mycart />} />
                    <Route path='/myorders' element={<Myorders />} />
                    <Route path='/checkout' element={<CheckoutPage />} />
                    <Route path='/checkout/success' element={<CheckoutSuccess />} />
                    <Route path='/skin-analysis' element={<SkinAnalysis />} />
                </Routes>
                </main>
                <Footer />
            </div>
        );
    }
}
export default Main;
