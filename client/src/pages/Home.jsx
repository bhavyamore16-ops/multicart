import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Store, Flame, Award } from 'lucide-react';
import HeroBanner from '../components/home/HeroBanner';
import ProductCard from '../components/common/ProductCard';
import { CATEGORIES, PRODUCTS, VENDORS, TESTIMONIALS } from '../data/mockData';

const Home = () => {
  const featuredProducts = PRODUCTS.filter(p => p.isFeatured);
  const latestProducts = PRODUCTS.filter(p => p.isLatest);

  return (
    <div className="space-y-16 lg:space-y-24 pb-20">
      
      {/* Hero Section */}
      <HeroBanner />

      {/* 1. Product Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Explore Top Collections</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Browse by Category
            </h2>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map(category => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all text-center flex flex-col p-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-2xl overflow-hidden mb-3 bg-slate-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {category.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {category.itemCount} Items
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Handpicked by Curators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Products
            </h2>
          </div>
          <Link
            to="/products?featured=true"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>See All Featured</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3. Multi-Vendor Store Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider mb-4">
              Decentralized Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 leading-snug">
              Are you an independent seller or retail artisan?
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8">
              Open your digital storefront on MultiCart today. Benefit from our unified split-order engine, reach millions of consumers, and manage your inventory with zero monthly fees.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/become-seller"
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>Launch Your Store</span>
              </Link>
              <Link
                to="/about"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md transition-all border border-white/20"
              >
                Learn How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Latest Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Just Added to Stores</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Latest Products
            </h2>
          </div>
          <Link
            to="/products?sort=newest"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>Explore All New</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Verified Sellers Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            <Award className="w-4 h-4" />
            <span>Meet Our Top Sellers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verified Marketplace Vendors
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            Every seller on MultiCart undergoes strict identity and quality verification before listing goods.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VENDORS.map(vendor => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center hover:shadow-lg transition-all"
            >
              <img
                src={vendor.storeLogo}
                alt={vendor.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-50 mb-4 shadow-sm"
              />
              <h3 className="font-bold text-slate-900 text-base">{vendor.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{vendor.location}</p>
              
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs mt-3 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <span>★ {vendor.rating}</span>
                <span className="text-slate-400 font-normal">({vendor.reviews} reviews)</span>
              </div>

              <Link
                to={`/products?vendor=${vendor.id}`}
                className="mt-5 w-full py-2 border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold rounded-xl transition-all"
              >
                View Storefront
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section className="bg-slate-100 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trusted by Shoppers & Sellers
            </h2>
            <p className="text-slate-500 text-sm mt-2">
              See what our community says about MultiCart's unified checkout experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 text-sm mb-4">
                    {"★".repeat(t.rating)}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed italic mb-6">
                    "{t.comment}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-400">{t.role} • {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
