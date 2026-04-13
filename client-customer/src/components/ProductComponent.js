import axios from 'axios';
import React, { Component } from 'react';
import withRouter from '../utils/withRouter';
import ProductCard from './ui/ProductCard';

class Product extends Component {
    constructor(props) {
        super(props);
        this.state = {
            products: []
        };
    }
    render() {
        const params = this.props.params || {};
        const title = params.cid ? 'Category' : (params.keyword ? `Results for "${params.keyword}"` : 'Products');
        return (
            <div className="ads-container ads-section">
                <div className="ads-section__head">
                    <h2 className="ads-section__title">{title}</h2>
                    <span className="ads-section__sub">{this.state.products.length} items</span>
                </div>
                <div className="ads-grid">
                    {this.state.products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>
            </div>
        );
    }
    componentDidMount() { // first: /product/...
        const params = this.props.params;
        if (params.cid) {
            this.apiGetProductsByCatID(params.cid);
        } else if (params.keyword) {
            this.apiGetProductsByKeyword(params.keyword);
        }
    }
    componentDidUpdate(prevProps) { // changed: /product/...
        const params = this.props.params;
        if (params.cid && params.cid !== prevProps.params.cid) {
            this.apiGetProductsByCatID(params.cid);
        } else if (params.keyword && params.keyword !== prevProps.params.keyword) {
            this.apiGetProductsByKeyword(params.keyword);
        }
    }
    // apis
    apiGetProductsByCatID(cid) {
        axios.get('/api/customer/products/category/' + cid).then((res) => {
            const result = res.data;
            this.setState({ products: result });
        }).catch((err) => {
            console.error('Get products by category failed:', err.message);
            this.setState({ products: [] });
        });
    }
    apiGetProductsByKeyword(keyword) {
        axios.get('/api/customer/products/search/' + keyword).then((res) => {
            const result = res.data;
            this.setState({ products: result });
        }).catch((err) => {
            console.error('Search products failed:', err.message);
            this.setState({ products: [] });
        });
    }
}
export default withRouter(Product);
