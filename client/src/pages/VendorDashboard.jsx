import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { productAPI, categoryAPI } from '../services/api';
import {
  Store, CheckCircle2, Clock, AlertTriangle, Package, ShoppingBag,
  IndianRupee, TrendingUp, Plus, Pencil, Trash2, X, Eye, EyeOff,
  BarChart2, Boxes, AlertCircle, Search, ChevronDown, Image, Tag,
  Info, RefreshCw, Star
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));
const fmtPrice = (n) => `₹${fmt(n)}`;

const TABS = [
  { id: 'overview',   label: 'Overview',          icon: BarChart2 },
  { id: 'products',   label: 'My Products',        icon: Package },
  { id: 'inventory',  label: 'Inventory',          icon: Boxes },
  { id: 'add',        label: 'Add Product',        icon: Plus },
];

// ── Mock data for when server is offline ─────────────────────────────────────
const MOCK_PRODUCTS = [
  { _id: 'p1', name: 'Sony WH-1000XM5 Headphones', price: 29990, discountPercent: 15, stock: 45, isAvailable: true, thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=80&q=80', category: { name: 'Electronics' }, rating: { average: 4.7, count: 234 }, totalSales: 89, createdAt: new Date().toISOString() },
  { _id: 'p2', name: 'Apple AirPods Pro (3rd Gen)', price: 24900, discountPercent: 8, stock: 30, isAvailable: true, thumbnail: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=80&q=80', category: { name: 'Electronics' }, rating: { average: 4.8, count: 567 }, totalSales: 154, createdAt: new Date().toISOString() },
  { _id: 'p3', name: 'Samsung Galaxy S24 Ultra', price: 134999, discountPercent: 5, stock: 3, isAvailable: true, thumbnail: 'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?auto=format&fit=crop&w=80&q=80', category: { name: 'Electronics' }, rating: { average: 4.6, count: 189 }, totalSales: 42, createdAt: new Date().toISOString() },
  { _id: 'p4', name: 'Boat Airdopes 141', price: 1499, discountPercent: 40, stock: 0, isAvailable: false, thumbnail: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=80&q=80', category: { name: 'Electronics' }, rating: { average: 4.1, count: 1240 }, totalSales: 678, createdAt: new Date().toISOString() },
];
const MOCK_CATEGORIES = [
  { _id: 'c1', name: 'Electronics', slug: 'electronics' },
  { _id: 'c2', name: 'Fashion', slug: 'fashion' },
  { _id: 'c3', name: 'Home & Kitchen', slug: 'home-kitchen' },
  { _id: 'c4', name: 'Sports', slug: 'sports' },
  { _id: 'c5', name: 'Books', slug: 'books' },
  { _id: 'c6', name: 'Beauty & Health', slug: 'beauty-health' },
];

// ── ProductForm component ─────────────────────────────────────────────────────
const ProductForm = ({ initial, categories, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    name:             initial?.name             || '',
    description:      initial?.description      || '',
    shortDescription: initial?.shortDescription || '',
    price:            initial?.price            || '',
    discountPercent:  initial?.discountPercent  || 0,
    stock:            initial?.stock            || '',
    category:         initial?.category?._id || initial?.category || '',
    images:           initial?.images?.join('\n') || '',
    isAvailable:      initial?.isAvailable !== undefined ? initial.isAvailable : true,
    tags:             initial?.tags?.join(', ') || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Product name is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter a valid price greater than 0.';
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0) e.stock = 'Stock must be 0 or more.';
    if (!form.category)           e.category    = 'Please select a category.';
    if (form.discountPercent < 0 || form.discountPercent > 100) e.discountPercent = 'Discount must be 0–100%.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const imagesArr = form.images
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    onSubmit({
      name:             form.name.trim(),
      description:      form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price:            Number(form.price),
      discountPercent:  Number(form.discountPercent),
      stock:            Number(form.stock),
      category:         form.category,
      images:           imagesArr,
      thumbnail:        imagesArr[0] || '',
      isAvailable:      form.isAvailable,
      tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const discounted = form.price && form.discountPercent
    ? Math.round(Number(form.price) * (1 - Number(form.discountPercent) / 100))
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Product Name <span className="text-rose-500">*</span></label>
        <input
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
          value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
        />
        {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Description <span className="text-slate-400">(max 300 chars)</span></label>
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
          placeholder="One-liner summary shown on product cards" maxLength={300}
        />
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Description <span className="text-rose-500">*</span></label>
        <textarea
          rows={5}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.description ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
          value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Detailed product description, features, specifications..."
        />
        {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Price + Discount */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Price (₹) <span className="text-rose-500">*</span></label>
          <input
            type="number" min="0" step="0.01"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.price ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
            value={form.price} onChange={e => set('price', e.target.value)}
            placeholder="29990"
          />
          {errors.price && <p className="text-rose-500 text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Discount %</label>
          <input
            type="number" min="0" max="100"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.discountPercent ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
            value={form.discountPercent} onChange={e => set('discountPercent', Number(e.target.value))}
            placeholder="0"
          />
          {errors.discountPercent && <p className="text-rose-500 text-xs mt-1">{errors.discountPercent}</p>}
        </div>
        <div className="flex flex-col justify-end">
          {discounted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Selling Price</p>
              <p className="text-lg font-black text-emerald-700">{fmtPrice(discounted)}</p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center text-xs text-slate-400">Discounted price preview</div>
          )}
        </div>
      </div>

      {/* Stock + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Stock Quantity <span className="text-rose-500">*</span></label>
          <input
            type="number" min="0"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.stock ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
            value={form.stock} onChange={e => set('stock', e.target.value)}
            placeholder="100"
          />
          {errors.stock && <p className="text-rose-500 text-xs mt-1">{errors.stock}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Category <span className="text-rose-500">*</span></label>
          <select
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.category ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
            value={form.category} onChange={e => set('category', e.target.value)}
          >
            <option value="">Select a category...</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.icon || ''} {c.name}</option>
            ))}
          </select>
          {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
        </div>
      </div>

      {/* Image URLs */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5" /> Product Image URLs <span className="text-slate-400">(one per line; first image = thumbnail)</span>
        </label>
        <textarea
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.images} onChange={e => set('images', e.target.value)}
          placeholder="https://images.unsplash.com/photo-xxxx&#10;https://..."
        />
        <p className="text-[10px] text-slate-400 mt-1">Paste Cloudinary, Unsplash or any public image URL. Cloudinary upload coming in next phase.</p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" /> Tags <span className="text-slate-400">(comma-separated)</span>
        </label>
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.tags} onChange={e => set('tags', e.target.value)}
          placeholder="wireless, sony, noise-cancelling, premium"
        />
      </div>

      {/* Availability */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('isAvailable', !form.isAvailable)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${form.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isAvailable ? 'translate-x-6' : ''}`} />
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {form.isAvailable ? 'Listed — visible to customers' : 'Unlisted — hidden from marketplace'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={loading}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
          {initial ? 'Update Product' : 'Publish Product'}
        </button>
        <button
          type="button" onClick={onCancel}
          className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// ── Main VendorDashboard ──────────────────────────────────────────────────────
const VendorDashboard = () => {
  const { user, vendorProfile } = useAuth();
  const status     = vendorProfile?.status || 'pending';
  const isApproved = status === 'approved';

  const [activeTab, setActiveTab]         = useState('overview');
  const [products,  setProducts]          = useState([]);
  const [categories, setCategories]       = useState([]);
  const [stats,     setStats]             = useState(null);
  const [loading,   setLoading]           = useState(false);
  const [formLoading, setFormLoading]     = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);   // null = no edit, object = edit
  const [showAddForm, setShowAddForm]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [notification, setNotification]  = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);    // product id

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!isApproved) return;
    setLoading(true);
    try {
      const [prodRes, catRes, statsRes] = await Promise.allSettled([
        productAPI.getMyProducts(),
        categoryAPI.getAll(),
        productAPI.getStats()
      ]);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || []);
      else setProducts(MOCK_PRODUCTS);

      if (catRes.status === 'fulfilled') setCategories(catRes.value.categories || []);
      else setCategories(MOCK_CATEGORIES);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
    } catch (err) {
      setProducts(MOCK_PRODUCTS);
      setCategories(MOCK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => { loadData(); }, [loadData]);

  // Also load categories for not-yet-approved vendors (for the add form)
  useEffect(() => {
    if (!isApproved) {
      categoryAPI.getAll().then(r => setCategories(r.categories || [])).catch(() => setCategories(MOCK_CATEGORIES));
    }
  }, [isApproved]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      const res = await productAPI.create(data);
      setProducts(prev => [res.product, ...prev]);
      setShowAddForm(false);
      notify('Product published successfully!');
      setActiveTab('products');
    } catch (err) {
      // Offline mock
      const mock = { _id: 'new_' + Date.now(), ...data, category: categories.find(c => c._id === data.category) || { name: 'Unknown' }, rating: { average: 0, count: 0 }, totalSales: 0, createdAt: new Date().toISOString() };
      setProducts(prev => [mock, ...prev]);
      setShowAddForm(false);
      notify('Product saved (offline mode).', 'warning');
      setActiveTab('products');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      const res = await productAPI.update(editingProduct._id, data);
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? res.product : p));
      setEditingProduct(null);
      notify('Product updated successfully!');
    } catch (err) {
      // Offline mock
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? { ...p, ...data, category: categories.find(c => c._id === data.category) || p.category } : p));
      setEditingProduct(null);
      notify('Product updated (offline mode).', 'warning');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productAPI.remove(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      notify('Product deleted successfully.');
    } catch {
      setProducts(prev => prev.filter(p => p._id !== productId));
      notify('Product deleted (offline mode).', 'warning');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const res = await productAPI.update(product._id, { isAvailable: !product.isAvailable });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p));
      notify(`Product ${!product.isAvailable ? 'listed' : 'unlisted'} successfully.`);
    } catch {
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p));
    }
  };

  // ── Filtered products ───────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Stats derived ───────────────────────────────────────────────────────────
  const totalProducts  = products.length;
  const activeProducts = products.filter(p => p.isAvailable).length;
  const outOfStock     = products.filter(p => p.stock === 0).length;
  const lowStock       = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const totalRevenue   = stats?.totalRevenue || vendorProfile?.totalEarnings || 0;
  const withdrawable   = stats?.withdrawable || vendorProfile?.withdrawableBalance || 0;

  // ── Status banner ───────────────────────────────────────────────────────────
  const StatusBanner = () => {
    if (status === 'pending') return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0"><Clock className="w-5 h-5" /></div>
        <div>
          <h3 className="font-black text-amber-900 text-sm">Application Pending Review</h3>
          <p className="text-xs text-amber-800 mt-1">Your vendor application is under administrator review. Product management will be unlocked once approved.</p>
        </div>
        <span className="ml-auto shrink-0 px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>
      </div>
    );
    if (status === 'rejected') return (
      <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
        <div>
          <h3 className="font-black text-rose-900 text-sm">Application Rejected</h3>
          <p className="text-xs text-rose-800 mt-1">Reason: {vendorProfile?.rejectionReason || 'Business verification failed.'}</p>
        </div>
      </div>
    );
    if (status === 'suspended') return (
      <div className="bg-orange-50 border border-orange-300 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5" /></div>
        <div>
          <h3 className="font-black text-orange-900 text-sm">Account Suspended</h3>
          <p className="text-xs text-orange-800 mt-1">Contact support to resolve the suspension.</p>
        </div>
      </div>
    );
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8 flex gap-3 items-center">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
        <div>
          <p className="font-bold text-emerald-900 text-sm">Verified & Active Storefront</p>
          <p className="text-xs text-emerald-700">All published products are live on the marketplace.</p>
        </div>
        <span className="ml-auto shrink-0 px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-black uppercase tracking-widest">Approved</span>
      </div>
    );
  };

  // ── Overview Tab ─────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Products',   value: activeProducts, icon: Package,      color: 'blue'    },
          { label: 'Total Products',    value: totalProducts,  icon: Boxes,        color: 'purple'  },
          { label: 'Out of Stock',      value: outOfStock,     icon: AlertCircle,  color: 'rose'    },
          { label: 'Low Stock (≤5)',    value: lowStock,       icon: AlertTriangle,color: 'amber'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl bg-${color}-50 text-${color}-600 flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-2xl font-black text-slate-900">{isApproved ? value : 0}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Total Revenue Earned</p>
          <p className="text-3xl font-black">{fmtPrice(totalRevenue)}</p>
          <p className="text-xs opacity-60 mt-1">Lifetime earnings on MultiCart</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Withdrawable Balance</p>
          <p className="text-3xl font-black">{fmtPrice(withdrawable)}</p>
          <p className="text-xs opacity-60 mt-1">Available for payout request</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Platform Commission</p>
          <p className="text-3xl font-black">{vendorProfile?.commissionRate || 10}%</p>
          <p className="text-xs opacity-60 mt-1">Per-sale platform fee</p>
        </div>
      </div>

      {/* Quick product preview */}
      {isApproved && products.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-slate-900">Recent Products</h3>
            <button onClick={() => setActiveTab('products')} className="text-xs text-blue-600 font-bold hover:underline">View all →</button>
          </div>
          <div className="space-y-3">
            {products.slice(0, 4).map(p => (
              <div key={p._id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100" onError={e => e.target.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=40&q=60'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category?.name || 'N/A'} · Stock: {p.stock}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">{fmtPrice(p.price)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {p.isAvailable ? 'Live' : 'Hidden'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-black text-slate-900 mb-5">Store Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          {[
            { label: 'Store Name',       value: vendorProfile?.storeName || '—' },
            { label: 'Business Email',   value: vendorProfile?.businessEmail || user?.email || '—' },
            { label: 'Business Phone',   value: vendorProfile?.businessPhone || '—' },
            { label: 'Business Address', value: vendorProfile?.businessAddress || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
              <p className="font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Products Tab ─────────────────────────────────────────────────────────────
  const ProductsTab = () => (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search products…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setShowAddForm(false); setEditingProduct(null); setActiveTab('add'); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-3" />
          <span className="text-slate-500 text-sm">Loading products…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h3 className="font-black text-slate-900 mb-2">No products yet</h3>
          <p className="text-slate-500 text-sm mb-5">Add your first product to start selling.</p>
          <button onClick={() => setActiveTab('add')} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors">
            Add First Product
          </button>
        </div>
      )}

      {/* Product table */}
      {!loading && filteredProducts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 min-w-[220px]">Product</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Category</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Price</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Discount</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Stock</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Rating</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0" onError={e => e.target.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=40&q=60'} />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-[180px]">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.totalSales || 0} sold</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">{fmtPrice(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.discountPercent > 0
                        ? <span className="text-emerald-600 font-bold">{p.discountPercent}% off</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${p.stock === 0 ? 'text-rose-600' : p.stock <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleAvailability(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${p.isAvailable ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        title={p.isAvailable ? 'Click to hide' : 'Click to list'}
                      >
                        {p.isAvailable ? 'Live' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-slate-700">{p.rating?.average?.toFixed(1) || '0.0'}</span>
                        <span className="text-[10px] text-slate-400">({p.rating?.count || 0})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditingProduct(p); setActiveTab('add'); }}
                          className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors" title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p._id)}
                          className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors" title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredProducts.length} of {totalProducts} products</span>
            <span>{activeProducts} live · {totalProducts - activeProducts} hidden</span>
          </div>
        </div>
      )}
    </div>
  );

  // ── Inventory Tab ────────────────────────────────────────────────────────────
  const InventoryTab = () => {
    const sorted = [...products].sort((a, b) => a.stock - b.stock);
    return (
      <div className="space-y-5">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Out of Stock',  count: outOfStock, color: 'rose'   },
            { label: 'Low Stock ≤5',  count: lowStock,   color: 'amber'  },
            { label: 'In Stock',      count: totalProducts - outOfStock - lowStock, color: 'emerald' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`flex items-center gap-2 px-4 py-2 bg-${color}-50 border border-${color}-200 rounded-xl`}>
              <span className={`text-${color}-700 font-black text-lg`}>{count}</span>
              <span className={`text-${color}-600 text-xs font-bold`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-slate-500" />
            <h3 className="font-black text-slate-900">Inventory Status</h3>
            <span className="ml-auto text-xs text-slate-400">Sorted by stock (low first)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Product</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Stock</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Price</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Status</th>
                  <th className="text-center px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400">No products found.</td></tr>
                ) : sorted.map(p => {
                  const stockStatus = p.stock === 0 ? { label: 'Out of Stock', cls: 'bg-rose-100 text-rose-700' }
                    : p.stock <= 5 ? { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' }
                    : { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700' };
                  return (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" onError={e => e.target.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=36&q=60'} />
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-black text-lg ${p.stock === 0 ? 'text-rose-600' : p.stock <= 5 ? 'text-amber-600' : 'text-slate-800'}`}>{p.stock}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">{fmtPrice(p.price)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${stockStatus.cls}`}>{stockStatus.label}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => { setEditingProduct(p); setActiveTab('add'); }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Update Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ── Add/Edit Tab ─────────────────────────────────────────────────────────────
  const AddEditTab = () => (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
          {editingProduct ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="font-black text-slate-900">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
          <p className="text-xs text-slate-500">{editingProduct ? `Editing: ${editingProduct.name}` : 'Fill in the details below to publish a new product.'}</p>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <ProductForm
          initial={editingProduct}
          categories={categories}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          onCancel={() => { setEditingProduct(null); setActiveTab(editingProduct ? 'products' : 'overview'); }}
          loading={formLoading}
        />
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold text-white animate-bounce-in
          ${notification.type === 'success' ? 'bg-emerald-600' : notification.type === 'warning' ? 'bg-amber-500' : 'bg-rose-600'}`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
          <button onClick={() => setNotification(null)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-center font-black text-slate-900 text-lg mb-2">Delete Product?</h3>
            <p className="text-center text-sm text-slate-500 mb-6">This action cannot be undone. The product will be permanently removed from the marketplace.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-colors">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900">Vendor Dashboard</h1>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">Seller Portal</span>
          </div>
          <p className="text-xs text-slate-500">
            Store: <strong className="text-slate-800">{vendorProfile?.storeName || 'My Store'}</strong> · {user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setEditingProduct(null); setActiveTab('add'); }}
            disabled={!isApproved}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isApproved ? 'bg-blue-600 hover:bg-blue-700 text-white shadow' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            title={!isApproved ? 'Approval required to add products' : ''}
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <StatusBanner />

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { if (id !== 'add') { setEditingProduct(null); } setActiveTab(id); }}
            disabled={!isApproved && id !== 'overview'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap
              ${activeTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
              ${(!isApproved && id !== 'overview') ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview'  && <OverviewTab />}
      {activeTab === 'products'  && <ProductsTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'add'       && <AddEditTab />}
    </div>
  );
};

export default VendorDashboard;
