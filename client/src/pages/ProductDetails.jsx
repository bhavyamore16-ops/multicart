import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, Store, Plus, Minus, Heart, Package, Send, LoaderCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { productAPI, reviewAPI } from '../services/api';
import { normalizeProduct } from '../utils/product';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/common/ProductCard';

const ProductDetails = () => {
  const { slug } = useParams();
  const { addToCart, cartItems } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [reviewDraft, setReviewDraft] = useState({ orderId: '', rating: 5, title: '', comment: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setProduct(null);
    setRelatedProducts([]);
    setReviews([]);
    setEligibleOrders([]);
    setReviewNotice('');
    productAPI.getById(slug)
      .then(async response => {
        if (cancelled) return;
        const loaded = normalizeProduct(response.product);
        setProduct(loaded);
        setActiveImage(loaded.gallery[0] || loaded.image || '');
        setSelectedQty(1);
        if (loaded.categorySlug) {
          try {
            const related = await productAPI.getAll({ category: loaded.categorySlug, sort: 'rating', limit: 4 });
            if (!cancelled) setRelatedProducts((related.products || []).filter(p => String(p._id) !== loaded.id).map(normalizeProduct).slice(0, 3));
          } catch { /* Product detail remains useful when related products cannot load. */ }
        }
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Product details could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    if (!product?.id) return undefined;
    let cancelled = false;
    setReviewLoading(true);
    setReviewError('');
    Promise.allSettled([
      reviewAPI.get(product.id),
      user?.role === 'customer' ? reviewAPI.getEligibility(product.id) : Promise.resolve({ eligibleOrders: [] })
    ]).then(([reviewOutcome, eligibilityOutcome]) => {
      if (cancelled) return;
      if (reviewOutcome.status === 'fulfilled') {
        const reviewResult = reviewOutcome.value;
        setReviews(reviewResult.reviews || []);
        setProduct(current => current ? { ...current, rating: Number(reviewResult.rating?.average ?? current.rating), reviewCount: Number(reviewResult.rating?.count ?? current.reviewCount) } : current);
      } else {
        setReviewError(reviewOutcome.reason?.message || 'Product reviews could not be loaded.');
      }
      if (eligibilityOutcome.status === 'fulfilled') {
        const eligible = eligibilityOutcome.value.eligibleOrders || [];
        setEligibleOrders(eligible);
        setReviewDraft(current => ({ ...current, orderId: eligible[0]?.id || '' }));
      } else if (user?.role === 'customer') {
        setReviewError(current => current || eligibilityOutcome.reason?.message || 'Review eligibility could not be checked.');
      }
    }).finally(() => { if (!cancelled) setReviewLoading(false); });
    return () => { cancelled = true; };
  }, [product?.id, user?.role]);

  if (loading) {
    return <div className="flex max-w-7xl items-center justify-center gap-3 px-4 py-20 text-center text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />Loading product details…</div>;
  }
  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h1 className="text-2xl font-black text-slate-900 mb-2">Product unavailable</h1>
        <p role="alert" className="text-sm text-slate-500 mb-6">{error || 'This product is no longer available in the marketplace.'}</p>
        <Link to="/products" className="inline-flex px-5 py-3 rounded-xl bg-blue-600 text-white font-bold">Browse products</Link>
      </div>
    );
  }

  const gallery = product.gallery.length ? product.gallery : [product.image].filter(Boolean);
  const isInCart = cartItems.some(item => item.id === product.id);
  const isSaved = isWishlisted(product.id);
  const canBuy = product.isPurchasable && product.stock > 0;
  const specifications = product.specifications && typeof product.specifications === 'object'
    ? Object.entries(product.specifications instanceof Map ? Object.fromEntries(product.specifications) : product.specifications)
    : [];

  const handleAddToCart = () => addToCart(product, selectedQty);

  const handleSubmitReview = async event => {
    event.preventDefault();
    setReviewSaving(true);
    setReviewError('');
    setReviewNotice('');
    try {
      const result = await reviewAPI.create(product.id, reviewDraft);
      setReviews(current => [result.review, ...current]);
      setProduct(current => ({ ...current, rating: result.rating.average, reviewCount: result.rating.count }));
      setEligibleOrders(current => current.filter(order => order.id !== reviewDraft.orderId));
      setReviewDraft(current => ({ ...current, orderId: eligibleOrders.find(order => order.id !== current.orderId)?.id || '', title: '', comment: '' }));
      setReviewNotice(result.message || 'Your review has been published.');
    } catch (submitError) {
      setReviewError(submitError.message || 'Your review could not be submitted.');
    } finally { setReviewSaving(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-blue-600">Home</Link><span>/</span>
        <Link to="/products" className="hover:text-blue-600">Products</Link><span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.categorySlug)}`} className="hover:text-blue-600">{product.categoryName}</Link><span>/</span>
        <span className="font-bold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-16">
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center">
            {activeImage ? <img src={activeImage} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-20 h-20 text-slate-300" />}
          </div>
          {gallery.length > 1 && <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {gallery.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActiveImage(image)} aria-label={`Show product image ${index + 1}`}
              className={`w-20 h-20 rounded-2xl overflow-hidden border-2 bg-slate-100 shrink-0 ${activeImage === image ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}>
              <img src={image} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
            </button>)}
          </div>}
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 border border-slate-200">
              <Store className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-600">Sold by <strong className="text-slate-900">{product.vendorName}</strong></span>
              {product.vendorVerified && <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <button type="button" onClick={() => toggleWishlist(product)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100">
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} /> {isSaved ? 'Saved' : 'Add to wishlist'}
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">{product.name}</h1>
          <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-slate-200 mb-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 font-bold px-2.5 py-1 rounded-lg border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" /><span>{product.rating.toFixed(1)}</span>
              <span className="font-normal text-slate-500">({product.reviewCount} ratings)</span>
            </div>
            <span aria-live="polite" className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${canBuy ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
              {canBuy ? `In stock · ${product.stock} available` : 'Currently unavailable'}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">₹{product.price.toLocaleString('en-IN')}</span>
            {product.originalPrice && <span className="text-lg text-slate-400 line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
            {product.discountPercent > 0 && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">{product.discountPercent}% off</span>}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">{product.description}</p>
          {specifications.length > 0 && <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Specifications</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{specifications.map(([key, value]) => <div key={key} className="text-xs"><dt className="text-slate-500">{key}</dt><dd className="font-semibold text-slate-800">{String(value)}</dd></div>)}</dl>
          </div>}

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1">
                <button onClick={() => setSelectedQty(qty => Math.max(1, qty - 1))} disabled={!canBuy} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40" aria-label="Decrease quantity"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-bold text-sm text-slate-900">{selectedQty}</span>
                <button onClick={() => setSelectedQty(qty => Math.min(product.stock, qty + 1))} disabled={!canBuy || selectedQty >= product.stock} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-40" aria-label="Increase quantity"><Plus className="w-4 h-4" /></button>
              </div>
              <button onClick={handleAddToCart} disabled={!canBuy || selectedQty > product.stock}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
                <ShoppingCart className="w-5 h-5" /><span>{canBuy ? (isInCart ? 'Add More to Cart' : 'Add to Shopping Cart') : 'Unavailable'}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200"><Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" /><span className="text-[11px] font-semibold text-slate-700 block">Vendor shipping</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200"><ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" /><span className="text-[11px] font-semibold text-slate-700 block">Approved vendor</span></div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200"><RotateCcw className="w-4 h-4 text-amber-600 mx-auto mb-1" /><span className="text-[11px] font-semibold text-slate-700 block">Marketplace support</span></div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><h2 className="text-xl font-black text-slate-900">Customer reviews</h2></div><span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">{product.rating.toFixed(1)} / 5 · {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}</span></div>
        {reviewError && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0" />{reviewError}</div>}
        {reviewNotice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{reviewNotice}</div>}
        {user?.role === 'customer' && eligibleOrders.length > 0 && <form onSubmit={handleSubmitReview} className="mb-7 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2"><MessageSquare size={17} className="text-blue-700" /><h3 className="font-extrabold text-slate-900">Review a delivered purchase</h3></div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-1" role="radiogroup" aria-label="Product rating">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={reviewDraft.rating === value} aria-label={`${value} star${value === 1 ? '' : 's'}`} onClick={() => setReviewDraft({ ...reviewDraft, rating: value })} className="rounded-md p-1"><Star className={`h-6 w-6 ${value <= reviewDraft.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div><select value={reviewDraft.orderId} onChange={event => setReviewDraft({ ...reviewDraft, orderId: event.target.value })} required className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><option value="">Choose delivered order</option>{eligibleOrders.map(order => <option value={order.id} key={order.id}>{order.orderNumber || order.id} · {new Date(order.deliveredAt).toLocaleDateString('en-IN')}</option>)}</select></div>
          <input value={reviewDraft.title} onChange={event => setReviewDraft({ ...reviewDraft, title: event.target.value })} maxLength={120} placeholder="Review title (optional)" className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <textarea required minLength={5} maxLength={2000} rows={4} value={reviewDraft.comment} onChange={event => setReviewDraft({ ...reviewDraft, comment: event.target.value })} placeholder="Share your experience with this product…" className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
          <button disabled={reviewSaving || !reviewDraft.orderId} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-50">{reviewSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}{reviewSaving ? 'Publishing…' : 'Publish review'}</button>
        </form>}
        {user?.role === 'customer' && !eligibleOrders.length && <p className="mb-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">Reviews are available after a purchase has been delivered. A purchase can be reviewed once.</p>}
        {!user && <p className="mb-5 text-sm text-slate-500"><Link to="/login" className="font-bold text-blue-700 hover:underline">Sign in</Link> to review after your order is delivered.</p>}
        {reviewLoading ? <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" />Loading reviews…</div> : reviews.length ? <div className="divide-y divide-slate-100">{reviews.map(review => <article key={review._id} className="py-5 first:pt-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-slate-900">{review.title || 'Customer review'}</h3><p className="mt-1 text-xs text-slate-500">{review.customer?.name || 'Customer'} · Verified purchase · {new Date(review.createdAt).toLocaleDateString('en-IN')}</p></div><div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map(value => <Star key={value} className={`h-4 w-4 ${value <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.comment}</p></article>)}</div> : !reviewError && <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">No written reviews yet. Be the first verified buyer to share your experience.</div>}
      </section>

      {relatedProducts.length > 0 && <section>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6">More from {product.categoryName}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{relatedProducts.map(item => <ProductCard key={item.id} product={item} />)}</div>
      </section>}
    </div>
  );
};

export default ProductDetails;
