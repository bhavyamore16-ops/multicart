import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlistItems, wishlistError, isLoading } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Heart className="w-6 h-6 fill-rose-100" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Wishlist</h1>
          <p className="text-sm text-slate-500">{wishlistItems.length} saved product{wishlistItems.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      {wishlistError && <p role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{wishlistError}</p>}

      {isLoading ? <p className="py-20 text-center text-slate-500">Loading your wishlist…</p> : wishlistItems.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-slate-500 mb-6">Save products you want to come back to.</p>
          <Link to="/products" className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Browse products</Link>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
