import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, Star, Store, RefreshCw } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { productAPI, categoryAPI } from '../services/api';
import { PRODUCTS, CATEGORIES, VENDORS } from '../data/mockData';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allProducts,  setAllProducts]  = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [usingMock,    setUsingMock]    = useState(false);

  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [maxPrice,         setMaxPrice]         = useState(200000);
  const [minRating,        setMinRating]        = useState(0);
  const [sortBy,           setSortBy]           = useState(searchParams.get('sort') || 'recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // ── Fetch real products ──────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          productAPI.getAll({ limit: 100 }),
          categoryAPI.getAll()
        ]);
        const prods = (prodRes.products || []).map(p => ({
          ...p,
          id:           p._id,
          slug:         p.slug || p._id,
          vendorName:   p.vendorProfile?.storeName || 'MultiCart Seller',
          vendorId:     p.vendor?._id || p.vendor,
          categorySlug: p.category?.slug || '',
          rating:       p.rating?.average || 0,
          reviewCount:  p.rating?.count   || 0,
          discountedPrice: p.discountPercent
            ? Math.round(p.price * (1 - p.discountPercent / 100))
            : p.price,
          isFeatured:   p.totalSales > 50,
          isLatest:     true,
        }));
        setAllProducts(prods.length > 0 ? prods : PRODUCTS);
        setCategories(catRes.categories?.length > 0 ? catRes.categories : CATEGORIES);
        setUsingMock(prods.length === 0);
      } catch {
        setAllProducts(PRODUCTS);
        setCategories(CATEGORIES);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) &&
            !p.description?.toLowerCase().includes(q) &&
            !(p.vendorName || '').toLowerCase().includes(q)) return false;
      }
      if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory && p.category?.slug !== selectedCategory && p.category?._id !== selectedCategory) return false;
      if ((p.price || 0) > maxPrice) return false;
      if ((p.rating || 0) < minRating) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low')  return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest')     return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return (b.totalSales || 0) - (a.totalSales || 0);
    });
  }, [allProducts, searchQuery, selectedCategory, maxPrice, minRating, sortBy]);

  const resetFilters = () => {
    setSearchQuery(''); setSelectedCategory('all');
    setMaxPrice(200000); setMinRating(0); setSortBy('recommended');
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters</span>
        </div>
        <button onClick={resetFilters} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Category</h4>
        <div className="space-y-1.5">
          <button onClick={() => setSelectedCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${selectedCategory === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <span>All Categories</span>
            <span className="text-[11px] opacity-75">{allProducts.length}</span>
          </button>
          {categories.map(cat => {
            const slug = cat.slug || cat.id;
            const count = allProducts.filter(p => p.categorySlug === slug || p.category?.slug === slug || p.category?._id === cat._id).length;
            return (
              <button key={cat._id || cat.id} onClick={() => setSelectedCategory(slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${selectedCategory === slug ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className="truncate">{cat.icon || ''} {cat.name}</span>
                <span className="text-[11px] opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Max Price</h4>
          <span className="text-xs font-bold text-slate-900">₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
        <input type="range" min="500" max="200000" step="500"
          value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>₹500</span><span>₹2,00,000+</span>
        </div>
      </div>

      {/* Rating */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Min Rating</h4>
        <div className="space-y-1">
          {[4.5, 4.0, 3.5, 0].map(rating => (
            <button key={rating} onClick={() => setMinRating(rating)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${minRating === rating ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating === 0 ? 'Any Rating' : `${rating} Stars & above`}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">
            {loading ? 'Loading products…' : (
              <>Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> products
                {usingMock && <span className="ml-2 text-xs text-amber-600 font-semibold">(demo data — start backend for live products)</span>}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, sellers..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-sm font-semibold"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-slate-200 h-fit sticky top-28">
          <FilterContent />
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Sort bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs font-semibold text-slate-500">
              {loading ? 'Loading…' : `${filteredProducts.length} results`}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Sort By:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="recommended">Best Sellers</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products grid */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredProducts.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Products Found</h3>
              <p className="text-sm text-slate-500 mb-6">Try clearing filters or searching with different keywords.</p>
              <button onClick={resetFilters}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors">
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Products;
