import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productAPI, categoryAPI, vendorAPI } from '../services/api';
import {
  Store, CheckCircle2, Clock, AlertTriangle, Package, ShoppingBag,
  IndianRupee, TrendingUp, Plus, Pencil, Trash2, X, Eye, EyeOff,
  BarChart2, Boxes, AlertCircle, Search, ChevronDown, Image, Tag,
  Info, RefreshCw, Star, Upload, FileImage, TrendingDown, Award,
  ShoppingCart, Activity, ArrowUpRight, BarChart
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt      = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));
const fmtPrice = (n) => `₹${fmt(n)}`;

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: BarChart2   },
  { id: 'products',   label: 'My Products',     icon: Package     },
  { id: 'inventory',  label: 'Inventory',       icon: Boxes       },
  { id: 'add',        label: 'Add Product',     icon: Plus        },
  { id: 'reports',    label: 'Sales Reports',   icon: BarChart    },
];

// ── ImageUpload sub-component ─────────────────────────────────────────────────
const ImageUpload = ({ value, onChange }) => {
  const fileRef    = useRef(null);
  const [preview, setPreview]   = useState(value?.startsWith('blob:') ? value : (value || ''));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlInput, setUrlInput]   = useState(value && !value.startsWith('blob:') ? value : '');
  const [mode, setMode]           = useState('url'); // 'url' | 'file'

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploadError('');
    setUploading(true);
    try {
      const res = await productAPI.uploadImage(file);
      URL.revokeObjectURL(localPreview);
      onChange(res.imageUrl);
      setUrlInput(res.imageUrl);
      setPreview(res.imageUrl);
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreview(value || '');
      setUploadError(error.message || 'Image upload failed. Try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleUrl = (v) => {
    setUrlInput(v);
    setPreview(v);
    onChange(v);
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {[{ k:'url', label:'Image URL' }, { k:'file', label:'Upload File' }].map(({ k, label }) => (
          <button key={k} type="button"
            onClick={() => setMode(k)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === k ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >{label}</button>
        ))}
      </div>

      {mode === 'url' ? (
        <input
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={urlInput}
          onChange={e => { setUploadError(''); handleUrl(e.target.value); }}
          placeholder="https://images.unsplash.com/photo-xxxx"
        />
      ) : (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl text-sm text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-60"
          >
            {uploading
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading…</>
              : <><Upload className="w-4 h-4" /> Click to choose image (JPEG / PNG / WebP · max 5 MB)</>}
          </button>
        </div>
      )}

      {uploadError && <p className="text-xs text-rose-600" role="alert">{uploadError}</p>}

      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img src={preview} alt="Preview" className="h-24 w-24 rounded-xl object-cover border border-slate-200 bg-slate-100" onError={() => setPreview('')} />
          <button type="button" onClick={() => { setPreview(''); setUrlInput(''); onChange(''); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors"
          ><X className="w-3 h-3" /></button>
        </div>
      )}
      <p className="text-[10px] text-slate-400">First image becomes the product thumbnail shown in listings.</p>
    </div>
  );
};

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
    thumbnail:        initial?.thumbnail        || (initial?.images?.[0] || ''),
    images:           initial?.images?.slice(1).join('\n') || '',
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
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0 || !Number.isInteger(Number(form.stock))) e.stock = 'Stock must be a whole number of 0 or more.';
    if (!form.category)           e.category    = 'Please select a category.';
    if (form.discountPercent < 0 || form.discountPercent > 100) e.discountPercent = 'Discount must be 0–100%.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const extraImages = form.images.split('\n').map(s => s.trim()).filter(Boolean);
    const allImages   = form.thumbnail ? [form.thumbnail, ...extraImages] : extraImages;
    onSubmit({
      name:             form.name.trim(),
      description:      form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price:            Number(form.price),
      discountPercent:  Number(form.discountPercent),
      stock:            Number(form.stock),
      category:         form.category,
      images:           allImages,
      thumbnail:        allImages[0] || '',
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
            type="number" min="0" step="1"
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

      {/* Thumbnail / Primary Image */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <FileImage className="w-3.5 h-3.5" /> Primary Image (Thumbnail) <span className="text-slate-400">(upload or paste URL)</span>
        </label>
        <ImageUpload value={form.thumbnail} onChange={v => set('thumbnail', v)} />
      </div>

      {/* Additional Image URLs */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5" /> Additional Image URLs <span className="text-slate-400">(one per line)</span>
        </label>
        <textarea
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.images} onChange={e => set('images', e.target.value)}
          placeholder="https://images.unsplash.com/photo-xxxx&#10;https://..."
        />
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

// ── SVG Bar Chart component ───────────────────────────────────────────────────
const BarChartSVG = ({ data, height = 180 }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const barW   = 100 / data.length;

  return (
    <div className="w-full" style={{ height: height + 40 }}>
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * 60} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1"/>
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const bH   = Math.max(4, (d.revenue / maxVal) * (height - 20));
          const bX   = i * 60 + 6;
          const bY   = height - bH;
          return (
            <g key={i}>
              <rect x={bX} y={bY} width={48} height={bH}
                fill="url(#barGrad)" rx="4"
                className="transition-all duration-500"
              />
              <title>{d.month}: {fmtPrice(d.revenue)} · {d.orders} orders</title>
            </g>
          );
        })}
      </svg>
      {/* Month labels */}
      <div className="flex">
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1 }} className="text-center text-[9px] text-slate-400 font-bold truncate px-1">
            {d.month.split(' ')[0]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main VendorDashboard ──────────────────────────────────────────────────────
const VendorDashboard = () => {
  const { user, vendorProfile, setVendorProfile } = useAuth();
  const status     = vendorProfile?.status || 'pending';
  const isApproved = status === 'approved';

  const [activeTab, setActiveTab]           = useState('overview');
  const [products,  setProducts]            = useState([]);
  const [categories, setCategories]         = useState([]);
  const [stats,     setStats]               = useState(null);
  const [report,    setReport]              = useState(null);
  const [reportLoading, setReportLoading]   = useState(false);
  const [loading,   setLoading]             = useState(false);
  const [loadError, setLoadError]           = useState('');
  const [reportError, setReportError]       = useState('');
  const [formLoading, setFormLoading]       = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [notification, setNotification]    = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);
  const [profileDraft, setProfileDraft] = useState({ storeName: '', businessEmail: '', businessPhone: '', businessAddress: '', storeDescription: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  useEffect(() => {
    setProfileDraft({
      storeName: vendorProfile?.storeName || '',
      businessEmail: vendorProfile?.businessEmail || user?.email || '',
      businessPhone: vendorProfile?.businessPhone || '',
      businessAddress: vendorProfile?.businessAddress || '',
      storeDescription: vendorProfile?.storeDescription || ''
    });
  }, [vendorProfile, user?.email]);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const saveVendorProfile = async event => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const result = await vendorAPI.updateProfile(profileDraft);
      setVendorProfile(result.vendorProfile);
      setProfileFeedback({ type: 'success', text: result.message || 'Store profile updated.' });
    } catch (error) {
      setProfileFeedback({ type: 'error', text: error.message || 'Store profile could not be updated.' });
    } finally { setProfileSaving(false); }
  };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!isApproved) return;
    setLoading(true);
    setLoadError('');
    try {
      const [prodRes, catRes, statsRes] = await Promise.allSettled([
        productAPI.getMyProducts(),
        categoryAPI.getAll(),
        productAPI.getStats()
      ]);
      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.products || []);
      else {
        setProducts([]);
        setLoadError(prodRes.reason?.message || 'Could not load your products.');
      }

      if (catRes.status === 'fulfilled') setCategories(catRes.value.categories || []);
      else {
        setCategories([]);
        setLoadError(current => current || catRes.reason?.message || 'Could not load categories.');
      }

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
      else {
        setStats(null);
        setLoadError(current => current || statsRes.reason?.message || 'Could not load dashboard totals.');
      }
    } catch (error) {
      setProducts([]);
      setCategories([]);
      setStats(null);
      setLoadError(error.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isApproved]);

  useEffect(() => { loadData(); }, [loadData]);

  // Also load categories for not-yet-approved vendors (for the add form)
  useEffect(() => {
    if (!isApproved) {
      categoryAPI.getAll().then(r => setCategories(r.categories || [])).catch(() => setCategories([]));
    }
  }, [isApproved]);

  // Load sales report when reports tab is activated
  useEffect(() => {
    if (activeTab !== 'reports' || !isApproved) return;
    setReportLoading(true);
    setReportError('');
    productAPI.getSalesReport()
      .then(r => setReport(r.report || null))
      .catch(error => {
        setReport(null);
        setReportError(error.message || 'Could not load sales reports.');
      })
      .finally(() => setReportLoading(false));
  }, [activeTab, isApproved]);

  // ── CRUD handlers ───────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      const res = await productAPI.create(data);
      const savedProduct = {
        ...res.product,
        category: categories.find(category => category._id === data.category) || res.product.category
      };
      setProducts(prev => [savedProduct, ...prev]);
      setShowAddForm(false);
      notify('Product published successfully!');
      setActiveTab('products');
    } catch (error) {
      notify(error.message || 'Product could not be saved.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      const res = await productAPI.update(editingProduct._id, data);
      const savedProduct = {
        ...res.product,
        category: categories.find(category => category._id === data.category) || res.product.category
      };
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? savedProduct : p));
      setEditingProduct(null);
      notify('Product updated successfully!');
    } catch (error) {
      notify(error.message || 'Product could not be updated.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productAPI.remove(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      setConfirmDelete(null);
      notify('Product deleted successfully.');
    } catch (error) {
      notify(error.message || 'Product could not be deleted.', 'error');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await productAPI.update(product._id, { isAvailable: !product.isAvailable });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p));
      notify(`Product ${!product.isAvailable ? 'listed' : 'unlisted'} successfully.`);
    } catch (error) {
      notify(error.message || 'Availability could not be changed.', 'error');
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
  const totalRevenue   = stats?.totalRevenue ?? vendorProfile?.totalEarnings ?? 0;
  const totalSales     = stats?.totalSales ?? products.reduce((sum, product) => sum + (product.totalSales || 0), 0);
  const withdrawable   = stats?.withdrawable || vendorProfile?.withdrawableBalance || 0;
  const totalOrders    = stats?.totalOrders  || 0;
  const recentOrders   = stats?.recentOrders || [];

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
          <p className="font-bold text-emerald-900 text-sm">Verified &amp; Active Storefront</p>
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
          { label: 'Active Products',  value: activeProducts, icon: Package,       color: 'blue'   },
          { label: 'Total Products',   value: totalProducts,  icon: Boxes,         color: 'purple' },
          { label: 'Total Orders',     value: totalOrders,    icon: ShoppingCart,  color: 'indigo' },
          { label: 'Out of Stock',     value: outOfStock,     icon: AlertCircle,   color: 'rose'   },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Units Sold</p>
          <p className="text-3xl font-black">{totalSales}</p>
          <p className="text-xs opacity-60 mt-1">Across your product catalog</p>
        </div>
        <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Platform Commission</p>
          <p className="text-3xl font-black">{vendorProfile?.commissionRate || 10}%</p>
          <p className="text-xs opacity-60 mt-1">Per-sale platform fee</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-blue-500" /> Recent Orders</h3>
          <button onClick={() => setActiveTab('reports')} className="text-xs text-blue-600 font-bold hover:underline">View reports →</button>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map(o => (
              <div key={o._id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">#{o.orderNumber}</p>
                  <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('en-IN')} · {o.itemCount} item(s)</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">{fmtPrice(o.total)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize
                    ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                      o.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No orders yet. Orders appear here once customers purchase your products.</p>
          </div>
        )}
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

      {/* Editable store profile */}
      <form onSubmit={saveVendorProfile} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="font-black text-slate-900 mb-1">Store Profile</h3>
        <p className="text-xs text-slate-500 mb-5">Keep your storefront and customer contact information current.</p>
        {profileFeedback && <div role={profileFeedback.type === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-xl border px-4 py-3 text-sm ${profileFeedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{profileFeedback.text}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Store name', 'storeName'], ['Business email', 'businessEmail'], ['Business phone', 'businessPhone']].map(([label, key]) => <label key={key} className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span><input required value={profileDraft[key]} onChange={event => setProfileDraft({ ...profileDraft, [key]: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>)}
          <label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Business address</span><input required value={profileDraft.businessAddress} onChange={event => setProfileDraft({ ...profileDraft, businessAddress: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-700">Store description</span><textarea maxLength={1000} rows={3} value={profileDraft.storeDescription} onChange={event => setProfileDraft({ ...profileDraft, storeDescription: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>
        </div>
        <button disabled={profileSaving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{profileSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{profileSaving ? 'Saving store profile…' : 'Save store profile'}</button>
      </form>
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

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-3" />
          <span className="text-slate-500 text-sm">Loading products…</span>
        </div>
      )}

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
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Out of Stock',  count: outOfStock, color: 'rose'    },
            { label: 'Low Stock ≤5',  count: lowStock,   color: 'amber'   },
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

  // ── Sales Reports Tab ─────────────────────────────────────────────────────────
  const ReportsTab = () => {
    if (reportLoading) return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-7 h-7 text-blue-500 animate-spin mr-3" />
        <span className="text-slate-500 text-sm">Loading sales data…</span>
      </div>
    );

    const r = report;
    if (!r) return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <BarChart className="w-14 h-14 text-slate-300 mx-auto mb-4" />
        <h3 className="font-black text-slate-900 mb-2">{reportError ? 'Sales report unavailable' : 'No report data'}</h3>
        <p className="text-slate-500 text-sm">{reportError || 'Add products and start selling to see your sales analytics here.'}</p>
      </div>
    );

    const maxRevenue = Math.max(...(r.monthlyData || []).map(m => m.revenue), 1);

    return (
      <div className="space-y-8">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue',     value: fmtPrice(r.totalRevenue),   icon: IndianRupee,  color: 'from-blue-600 to-blue-800'    },
            { label: 'Total Orders',      value: r.totalOrders,               icon: ShoppingCart, color: 'from-indigo-500 to-indigo-700' },
            { label: 'Avg. Order Value',  value: fmtPrice(r.avgOrderValue),  icon: TrendingUp,   color: 'from-emerald-500 to-emerald-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 opacity-90" />
                </div>
              </div>
              <p className="text-2xl font-black">{value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-black text-slate-900">Monthly Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months — hover bars for details</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
              <span className="text-xs text-slate-500 font-semibold">Revenue (₹)</span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[360px]">
              <BarChartSVG data={r.monthlyData} height={180} />
            </div>
          </div>

          {/* Monthly data table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Month</th>
                  <th className="text-right py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Revenue</th>
                  <th className="text-right py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Orders</th>
                  <th className="text-right py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Avg/Order</th>
                  <th className="py-2 pl-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(r.monthlyData || []).map((m, i) => {
                  const pct = Math.round((m.revenue / maxRevenue) * 100);
                  const avg = m.orders > 0 ? Math.round(m.revenue / m.orders) : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 font-semibold text-slate-800">{m.month}</td>
                      <td className="py-2 text-right font-bold text-slate-900">{fmtPrice(m.revenue)}</td>
                      <td className="py-2 text-right text-slate-600">{m.orders}</td>
                      <td className="py-2 text-right text-slate-600">{fmtPrice(avg)}</td>
                      <td className="py-2 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        {r.topProducts?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-black text-slate-900">Top Performing Products</h3>
              <span className="ml-auto text-xs text-slate-400">By total units sold</span>
            </div>
            <div className="space-y-3">
              {r.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                    ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
                    {i + 1}
                  </span>
                  <img src={p.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" onError={e => e.target.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=36&q=60'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{fmtPrice(p.price)} · {p.totalSales} units sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{fmtPrice(p.revenue)}</p>
                    <p className="text-[10px] text-slate-400">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Notification */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-sm font-bold text-white
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

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{vendorProfile?.storeName || 'Vendor Dashboard'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your storefront, products &amp; sales</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && <Link to="/orders" className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"><ShoppingBag className="h-3.5 w-3.5" />Manage orders</Link>}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <StatusBanner />

      {loadError && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
          <span>{loadError}</span>
          <button onClick={loadData} className="shrink-0 font-bold underline">Retry</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
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
      {activeTab === 'reports'   && <ReportsTab />}
    </div>
  );
};

export default VendorDashboard;
