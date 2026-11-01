import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

const Categories = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4">
          <Layers className="w-3.5 h-3.5" />
          <span>Curated Taxonomy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
          Explore Product Categories
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Browse items categorized across consumer tech, apparel, home lifestyle, footwear, books, and beauty products from our certified independent vendors.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {CATEGORIES.map(category => (
          <Link
            key={category.id}
            to={`/products?category=${category.slug}`}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 flex flex-col"
          >
            {/* Image Banner */}
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    {category.itemCount} Listed Items
                  </span>
                  <h3 className="text-xl font-black text-white group-hover:text-blue-200 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {category.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
};

export default Categories;
