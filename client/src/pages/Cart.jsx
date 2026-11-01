import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, Store, ArrowRight, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const {
    cartItems,
    itemsByVendor,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount,
    subtotal,
    totalDiscount,
    shippingFee,
    grandTotal,
    validateCart,
    cartError,
    isSyncing
  } = useCart();

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');

  const handleValidateCart = async () => {
    setValidating(true);
    setAvailabilityError('');
    try {
      const result = await validateCart();
      if (!result.success) {
        setAvailabilityError(result.message || 'Some items are no longer available. Remove them or adjust their quantities.');
        return;
      }
      navigate('/checkout');
    } catch (error) {
      setAvailabilityError(error.message || 'Unable to verify current product availability.');
    } finally {
      setValidating(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        {cartError && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{cartError} Refresh the page to retry.</p>}
        {isSyncing && <p className="mb-5 text-sm text-slate-500">Loading your saved cart…</p>}
        <div className="w-24 h-24 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">Your Shopping Cart is Empty</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-8">
          Explore products from our multi-vendor marketplace, add items to your cart, and enjoy unified checkout!
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {cartError && <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{cartError} Refresh the page to retry loading your saved cart.</div>}
      {availabilityError && <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{availabilityError}</div>}
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Multi-Vendor Cart</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            You have <strong className="text-slate-900">{totalItemsCount}</strong> items from{' '}
            <strong className="text-blue-600">{itemsByVendor.length}</strong> independent vendors.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{isAuthenticated && user?.role === 'customer' ? 'Saved to your customer account.' : 'Guest cart is saved in this browser.'}</p>
        </div>

        <button
          onClick={() => { if (window.confirm('Remove every item from your cart?')) clearCart(); }}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Multi-Vendor Item Groups */}
        <div className="lg:col-span-8 space-y-8">
          
          {itemsByVendor.map(vendorGroup => (
            <div
              key={vendorGroup.vendorId}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Vendor Group Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{vendorGroup.vendorName}</h3>
                    <p className="text-[11px] text-slate-500">Ships directly from merchant facility</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vendor Subtotal</span>
                  <span className="text-xs font-black text-slate-900">
                    ₹{vendorGroup.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Vendor Items */}
              <div className="divide-y divide-slate-100">
                {vendorGroup.items.map(item => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.slug || item.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">
                        Unit Price: <span className="font-bold text-slate-900">₹{item.price.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`text-[11px] font-semibold mt-1 ${item.isAvailable === false ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {item.isAvailable === false ? `Unavailable · ${item.stock} in stock` : `${item.stock} available`}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Reduce quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.isAvailable === false || item.quantity >= item.stock}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total & Remove */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-sm font-black text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>

        {/* Right Column: Order Summary & Checkout Box */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 sticky top-28">
            <h2 className="text-lg font-black text-slate-900 pb-4 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount</span>
                  <span className="font-semibold">-₹{totalDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated Shipping</span>
                <span className="font-semibold text-slate-900">
                  {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingFee}`}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handleValidateCart}
              disabled={validating || isSyncing}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <span>{validating ? 'Checking availability…' : 'Continue to checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Orders are split automatically per vendor</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Availability is checked against current product stock</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Cart;
