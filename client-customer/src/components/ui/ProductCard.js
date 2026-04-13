import React, { Component } from 'react';
import { Link } from 'react-router-dom';

function getImageSrc(image) {
  if (!image) return '';
  if (image.startsWith('http') || image.startsWith('data:')) return image;
  return 'data:image/jpg;base64,' + image;
}

function formatPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString('vi-VN') + ' ₫';
}

class ProductCard extends Component {
  render() {
    const { product } = this.props;
    if (!product) return null;

    return (
      <Link to={`/product/${product._id}`} className="ads-card">
        <div className="ads-card__media">
          <img className="ads-card__img" src={getImageSrc(product.image)} alt={product.name || 'Product'} />
          {product.hot === 1 ? <span className="ads-badge">HOT</span> : null}
        </div>
        <div className="ads-card__body">
          <div className="ads-card__name">{product.name}</div>
          <div className="ads-card__meta">
            <span className="ads-card__price">{formatPrice(product.price)}</span>
            <span className="ads-card__cat">{product.category && product.category.name}</span>
          </div>
        </div>
      </Link>
    );
  }
}

export default ProductCard;

