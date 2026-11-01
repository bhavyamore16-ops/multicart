import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Store, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, cartItems } = useCart();
  const isInCart = cartItems.some(item => item.id === product.id);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      
      {/* Discount Badge */}
      {product.discount && (
        <span className="absolute top-3 left-3 z-10 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-wider">
          {product.discount}
        </span>
      )}

      {/* Product Image with link */}
      <Link to={`/products/${product.slug || product.id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        
        {/* Vendor Tag */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
          <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-medium text-slate-600 truncate hover:text-blue-600 transition-colors">
            {product.vendorName}
          </span>
        </div>

        {/* Product Title */}
        <Link
          to={`/products/${product.slug || product.id}`}
          className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm sm:text-base leading-snug mb-2"
        >
          {product.name}
        </Link>

        {/* Rating Bar */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800 ml-1">{product.rating}</span>
          </div>
          <span className="text-xs text-slate-400">({product.reviewCount || 42})</span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-black text-slate-900 leading-none">
              ₹{product.price.toLocaleString('en-IN')}
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-xs text-slate-400 line-through mt-0.5">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
              isInCart
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
            title="Add to Cart"
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};

export default ProductCard;
