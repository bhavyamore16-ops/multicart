import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

const HeroBanner = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white py-12 lg:py-20 border-b border-slate-200">
      
      {/* Decorative gradient blur shapes */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-6 border border-blue-200 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Multi-Vendor Digital Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
              Shop Products From <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">Approved Vendors</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Browse live listings with current prices, ratings, and stock. Save products to your wishlist and shop from multiple independent vendors in one cart.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link
                to="/products"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2.5 group"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/become-seller"
                className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-300 hover:border-slate-400 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Store className="w-5 h-5 text-amber-600" />
                <span>Become a Seller</span>
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0">
              <div>
                <div className="text-lg font-black text-slate-900">Approved</div>
                <div className="text-xs text-slate-500 font-medium">Vendor listings</div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900">Live</div>
                <div className="text-xs text-slate-500 font-medium">Product stock</div>
              </div>
              <div>
                <div className="text-lg font-black text-slate-900">Real</div>
                <div className="text-xs text-slate-500 font-medium">Customer ratings</div>
              </div>
            </div>

          </div>

          {/* Right Visual Column */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/3] sm:aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80"
                  alt="MultiCart Shopping Experience"
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">MultiCart Marketplace</span>
                  <h3 className="text-xl font-bold">Discover Independent Stores</h3>
                  <p className="text-xs text-slate-300 mt-1">Shop products listed by approved vendors.</p>
                </div>
              </div>

              {/* Floating Multi-Vendor Split Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5 max-w-xs animate-in fade-in slide-in-from-bottom-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Multi-Vendor Cart</div>
                  <div className="text-[11px] text-slate-500">Keep products from multiple vendors together</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default HeroBanner;
