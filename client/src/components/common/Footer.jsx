import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Mail, Phone, MapPin, Heart, Shield, RefreshCw, Truck, Award } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      
      {/* Trust Badges Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Free Delivery</h4>
              <p className="text-xs text-slate-400">On all orders above ₹1,999</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Verified Sellers</h4>
              <p className="text-xs text-slate-400">KYC audited vendor stores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">7-Day Easy Returns</h4>
              <p className="text-xs text-slate-400">Hassle-free replacement policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Unified Checkout</h4>
              <p className="text-xs text-slate-400">One cart, multi-seller split orders</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Multi<span className="text-blue-500">Cart</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              India's premier multi-vendor digital shopping marketplace. Connect directly with independent sellers, artisans, and electronics retailers under one roof.
            </p>
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Cyber Tech Park, Bengaluru, Karnataka, India</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-sm mt-2">
              <Phone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>+91 (080) 4123-8899</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-sm mt-2">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span>support@multicart.marketplace</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-blue-400 transition-colors">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-blue-400 transition-colors">Product Categories</Link></li>
              <li><Link to="/become-seller" className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">Become a Seller</Link></li>
              <li><Link to="/cart" className="hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Care</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Stay Connected</h3>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe to receive weekly alerts for vendor flash sales and coupons.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Thank you for subscribing to MultiCart alerts!"); }} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Subscribe
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 MultiCart Inc. Final Year B.Sc. Computer Science Capstone Project.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Engineered with React.js & Tailwind CSS for Multi-Vendor E-Commerce</span>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
