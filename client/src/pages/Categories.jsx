import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Package, RefreshCw } from 'lucide-react';
import { categoryAPI, productAPI } from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    categoryAPI.getAll().then(async response => {
      const values = response.categories || [];
      const withCounts = await Promise.all(values.map(async category => {
        try {
          const result = await productAPI.getAll({ category: category.slug || category._id, page: 1, limit: 1 });
          return { ...category, productCount: result.total || 0 };
        } catch {
          return { ...category, productCount: 0 };
        }
      }));
      if (!cancelled) setCategories(withCounts);
    }).catch(err => {
      if (!cancelled) setError(err.message || 'Categories could not be loaded.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retryCount]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4"><Layers className="w-3.5 h-3.5" /><span>Marketplace catalog</span></div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">Explore Product Categories</h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Browse active categories and products listed by approved MultiCart vendors.</p>
      </div>

      {error && <div role="alert" className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><span>{error}</span><button onClick={() => setRetryCount(value => value + 1)} className="inline-flex items-center gap-2 font-bold"><RefreshCw className="w-4 h-4" /> Retry</button></div>}
      {loading ? <p className="py-20 text-center text-slate-500">Loading categories…</p> : categories.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map(category => <Link key={category._id} to={`/products?category=${encodeURIComponent(category.slug || category._id)}`}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 flex flex-col">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-100 flex items-center justify-center">
              {category.image ? <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Package className="w-14 h-14 text-slate-300" />}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div><span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">{category.productCount} listed products</span><h2 className="text-xl font-black text-white group-hover:text-blue-200">{category.name}</h2></div>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">{category.description || `Browse approved vendor products in ${category.name}.`}</p>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700"><span>Explore Catalog</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" /></div>
            </div>
          </Link>)}
        </div>
      ) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Package className="w-12 h-12 mx-auto mb-4 text-slate-300" /><h2 className="font-bold text-slate-800">No active categories yet</h2></div>}
    </div>
  );
};

export default Categories;
