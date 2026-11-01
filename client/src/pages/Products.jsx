import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, Star, RefreshCw, SlidersHorizontal, Package } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import { productAPI, categoryAPI } from '../services/api';
import { normalizeProduct } from '../utils/product';

const PAGE_SIZE = 24;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedVendor, setSelectedVendor] = useState(searchParams.get('vendor') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    categoryAPI.getAll()
      .then(response => { if (!cancelled) setCategories(response.categories || []); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  const currentFilters = useCallback(() => ({
    limit: PAGE_SIZE,
    sort: sortBy,
    ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    ...(selectedCategory !== 'all' ? { category: selectedCategory } : {}),
    ...(selectedVendor ? { vendor: selectedVendor } : {}),
    ...(minPrice !== '' ? { minPrice } : {}),
    ...(maxPrice !== '' ? { maxPrice } : {}),
    ...(minRating !== '' && Number(minRating) > 0 ? { minRating } : {})
  }), [searchQuery, selectedCategory, selectedVendor, minPrice, maxPrice, minRating, sortBy]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      setPage(1);
      productAPI.getAll({ ...currentFilters(), page: 1 })
        .then(response => {
          if (cancelled) return;
          setProducts((response.products || []).map(normalizeProduct));
          setPages(Number(response.pages || 1));
        })
        .catch(err => { if (!cancelled) { setProducts([]); setError(err.message || 'Products could not be loaded.'); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, searchQuery.trim() ? 250 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [currentFilters, searchQuery, retryCount]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const response = await productAPI.getAll({ ...currentFilters(), page: nextPage });
      setProducts(previous => [...previous, ...(response.products || []).map(normalizeProduct)]);
      setPage(nextPage);
      setPages(Number(response.pages || pages));
    } catch (err) {
      setError(err.message || 'More products could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery(''); setSelectedCategory('all'); setMinPrice(''); setMaxPrice(''); setMinRating(''); setSortBy('newest');
    setSelectedVendor('');
    setSearchParams({});
  };

  const filteredCount = useMemo(() => products.length, [products]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-base"><Filter className="w-4 h-4 text-blue-600" /><span>Filters</span></div>
        <button onClick={resetFilters} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reset</button>
      </div>
      <div>
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Category</h2>
        <div className="space-y-1.5">
          <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${selectedCategory === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>All Categories</button>
          {categories.map(category => <button key={category._id} onClick={() => setSelectedCategory(category.slug || category._id)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${selectedCategory === (category.slug || category._id) ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
            {category.icon || ''} {category.name}
          </button>)}
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">Price range (INR)</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-slate-500">Minimum
            <input type="number" min="0" step="1" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="₹0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800" />
          </label>
          <label className="text-[11px] text-slate-500">Maximum
            <input type="number" min="0" step="1" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="No limit" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800" />
          </label>
        </div>
        {minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice) && <p className="mt-2 text-[11px] text-rose-600">Minimum must be less than or equal to maximum.</p>}
      </div>
      <div className="pt-4 border-t border-slate-100">
        <h2 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Minimum rating</h2>
        <div className="space-y-1">{[['', 'Any Rating'], ['4.5', '4.5 stars & above'], ['4', '4 stars & above'], ['3.5', '3.5 stars & above']].map(([rating, label]) =>
          <button key={label} onClick={() => setMinRating(rating)} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${minRating === rating ? 'bg-amber-50 text-amber-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
            {rating && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}{label}
          </button>)}</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketplace Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">{loading ? 'Loading products…' : `Showing ${filteredCount} product${filteredCount === 1 ? '' : 's'} on this page`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search products by name…" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setMobileFilterOpen(true)} className="lg:hidden p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700"><SlidersHorizontal className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-slate-200 p-5 h-fit"><FilterContent /></aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500">{loading ? ' ' : `Found ${products.length} product${products.length === 1 ? '' : 's'}`}</p>
            <select value={sortBy} onChange={event => setSortBy(event.target.value)} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="newest">Newest</option><option value="price_asc">Price: Low to High</option><option value="price_desc">Price: High to Low</option><option value="rating">Highest Rated</option>
            </select>
          </div>

          {error && <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between gap-4"><span>{error}</span><button onClick={() => setRetryCount(count => count + 1)} className="underline font-bold">Retry</button></div>}
          {loading ? <div className="py-20 text-center text-slate-500">Loading approved vendor products…</div> : products.length ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
              {page < pages && <div className="text-center mt-10"><button onClick={loadMore} disabled={loadingMore} className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">{loadingMore ? 'Loading…' : 'Load more products'}</button></div>}
            </>
          ) : <div className="bg-white border border-slate-200 rounded-2xl py-20 text-center"><Package className="w-12 h-12 mx-auto mb-4 text-slate-300" /><h2 className="text-lg font-bold text-slate-800 mb-2">No products found</h2><p className="text-sm text-slate-500 mb-5">Try another search or adjust the selected filters.</p><button onClick={resetFilters} className="text-sm font-bold text-blue-600 hover:text-blue-700">Clear filters</button></div>}
        </div>
      </div>

      {mobileFilterOpen && <div className="fixed inset-0 z-50 bg-slate-900/50 lg:hidden" onClick={() => setMobileFilterOpen(false)}>
        <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white p-6 overflow-y-auto" onClick={event => event.stopPropagation()}>
          <div className="flex justify-between items-center mb-6"><h2 className="text-lg font-black">Filter products</h2><button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters"><X className="w-5 h-5" /></button></div>
          <FilterContent />
          <button onClick={() => setMobileFilterOpen(false)} className="mt-7 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white">Show products</button>
        </div>
      </div>}
    </div>
  );
};

export default Products;
