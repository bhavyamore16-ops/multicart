import React from 'react';
import { ShoppingCart, ShieldCheck, Truck, Users, Award, Store, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Academic Final Year Project Showcase</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
          Empowering Independent Merchants with Unified E-Commerce
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          <strong>MultiCart</strong> is a modern multi-vendor digital e-commerce ecosystem developed as a Final Year Capstone Project for the Bachelor of Science in Computer Science (B.Sc. CS).
        </p>
      </div>

      {/* The Problem & Solution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold mb-6">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">The Traditional Single-Store Problem</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              In conventional e-commerce setups, individual merchants must launch separate web stores, bear substantial hosting overheads, and market in silos. Consumers are forced to place disjointed orders across separate websites, paying duplicate delivery fees.
            </p>
          </div>
        </div>

        <div className="bg-blue-600 text-white p-8 sm:p-10 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold mb-6">
              ✨
            </div>
            <h3 className="text-xl font-black mb-3">The MultiCart Unified Solution</h3>
            <p className="text-sm text-blue-100 leading-relaxed">
              MultiCart provides a collaborative multi-tenant platform. Buyers maintain a single cross-vendor shopping cart and make one transaction. Behind the scenes, our <strong>Split-Order Decomposition Engine</strong> seamlessly bifurcates purchases and sends individual fulfillment tasks to each merchant.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          System Architectural Pillars
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2">
          Engineered strictly to IEEE 830 standards using the modern MERN stack.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-2">Automated Order Splitting</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Decomposes master transactions into isolated vendor sub-orders with independent shipping, delivery statuses, and tracking.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-2">Role-Based Access (RBAC)</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stateless JWT tokens with cryptographic signature validation protect endpoints across Super Administrators, Vendors, and Customers.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-5">
            <Store className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 mb-2">Vendor Autonomy</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Vendors enjoy dedicated dashboards to monitor store inventory, view settled earnings, and manage products without technical friction.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-2xl">
        <h3 className="text-2xl font-black mb-3">Ready to experience the marketplace?</h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
          Explore products from our verified sellers or register your virtual storefront today.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/products"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Browse Products
          </Link>
          <Link
            to="/become-seller"
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            Become a Seller
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AboutUs;
