import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, Store, Check, Plus, Minus, Share2 } from 'lucide-react';
import { PRODUCTS, VENDORS } from '../data/mockData';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart, cartItems } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);

  // Find product by slug or id
  const product = PRODUCTS.find(p => p.slug === slug || p.id === slug) || PRODUCTS[0];
  const vendor = VENDORS.find(v => v.id === product.vendorId) || VENDORS[0];
  const relatedProducts = PRODUCTS.filter(p => p.id !== product.id && p.categorySlug === product.categorySlug).slice(0, 3);

  const [activeImage, setActiveImage] = useState(product.gallery ? product.gallery[0] : product.image);
  const isInCart = cartItems.some(item => item.id === product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedQty);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.categorySlug}`} className="hover:text-blue-600 transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="font-bold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.discount && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {product.discount}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 bg-slate-100 shrink-0 transition-all ${
                    activeImage === img ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Purchase Actions */}
        <div className="lg:col-span-6 flex flex-col">
          
          {/* Vendor Card Badge */}
          <div className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 border border-slate-200 w-fit mb-3">
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs text-slate-600">
              Sold & fulfilled by: <strong className="text-slate-900">{product.vendorName}</strong>
            </span>
            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
              ★ {vendor.rating}
            </span>
          </div>

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {product.name}
          </h1>

          {/* Ratings & SKU */}
          <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-slate-200 mb-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 font-bold px-2.5 py-1 rounded-lg border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="font-normal text-slate-500">({product.reviewCount} customer reviews)</span>
            </div>
            <span>•</span>
            <span>SKU: <strong className="text-slate-800">{product.sku}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg">
              In Stock ({product.stock} units)
            </span>
          </div>

          {/* Price Tag */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-slate-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">
              Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Product Short Description */}
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Key Features Bullet List */}
          {product.features && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Key Highlights:</h4>
              {product.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector & Add to Cart */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                <button
                  onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-900">{selectedQty}</span>
                <button
                  onClick={() => setSelectedQty(Math.min(product.stock, selectedQty + 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{isInCart ? 'Add More to Cart' : 'Add to Shopping Cart'}</span>
              </button>
            </div>

            {/* Quick Guarantees */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">Fast Courier</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">Verified Vendor</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <RotateCcw className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">7-Day Return</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Customer Reviews Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 mb-16 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Verified Customer Reviews</h2>
            <p className="text-slate-500 text-xs mt-1">Real ratings submitted by confirmed MultiCart purchasers</p>
          </div>
          <button
            onClick={() => alert("Review modal opens for confirmed buyers who have purchased this product.")}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors self-start sm:self-auto"
          >
            Write a Review
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Rohit Deshmukh</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Verified Buyer
                </span>
              </div>
              <span className="text-[11px] text-slate-400">2 weeks ago</span>
            </div>
            <div className="flex text-amber-400 text-xs mb-2">★★★★★</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Superb sound quality and battery life! The vendor (Apex Electronics) dispatched the item within 12 hours of placing the order. Very satisfied with MultiCart.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Sneha Nair</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Verified Buyer
                </span>
              </div>
              <span className="text-[11px] text-slate-400">1 month ago</span>
            </div>
            <div className="flex text-amber-400 text-xs mb-2">★★★★☆</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exceeded expectations for this price range in INR. Packaging was sturdy and the noise cancellation works like a charm.
            </p>
          </div>
        </div>
      </section>

      {/* Related Products from this Category */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">
            More From {product.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map(rel => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default ProductDetails;
