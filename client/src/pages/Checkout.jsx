import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, CreditCard, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { cartAPI, orderAPI } from '../services/api';

const createCheckoutKey = () => window.crypto?.randomUUID?.() || `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const formatINR = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const existing = document.querySelector('script[data-razorpay-checkout]');
  if (existing) {
    existing.addEventListener('load', () => resolve(true), { once: true });
    existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay Checkout.')), { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.dataset.razorpayCheckout = 'true';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
  document.body.appendChild(script);
});

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, subtotal, shippingFee, grandTotal, totalItemsCount, itemsByVendor, clearCart, validateCart, isSyncing } = useCart();
  const navigate = useNavigate();
  const checkoutKey = useRef(createCheckoutKey());
  const submitting = useRef(false);
  const [shippingAddress, setShippingAddress] = useState(() => ({
    name: user?.name || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'India'
  }));
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [paymentOptions, setPaymentOptions] = useState({ cod: true, razorpay: false, keyId: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingState, setSubmittingState] = useState(false);
  const [cartValidation, setCartValidation] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([orderAPI.checkoutOptions(), cartAPI.validate()])
      .then(([options, validation]) => {
        if (!active) return;
        setPaymentOptions({
          cod: options.paymentMethods?.cod !== false,
          razorpay: Boolean(options.paymentMethods?.razorpay),
          keyId: options.razorpayKeyId || ''
        });
        setCartValidation(validation);
        if (!validation?.success) setError(validation?.message || 'One or more products are unavailable. Update your cart before checkout.');
      })
      .catch(requestError => {
        if (!active) return;
        setError(requestError.message || 'Unable to load checkout options.');
        if (requestError.status === 409) setCartValidation({ success: false });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const addressFields = useMemo(() => [
    ['name', 'Recipient name', 'text', 'text-left'],
    ['street', 'Street address', 'text', 'text-left'],
    ['city', 'City', 'text', 'text-left'],
    ['state', 'State / region', 'text', 'text-left'],
    ['postalCode', 'Postal code', 'text', 'text-left'],
    ['country', 'Country', 'text', 'text-left']
  ], []);

  const updateAddress = (field, value) => setShippingAddress(previous => ({ ...previous, [field]: value }));

  const finishOrder = async response => {
    await clearCart();
    navigate('/orders', { replace: true, state: { placed: response.masterOrderId } });
  };

  const handlePlaceOrder = async event => {
    event.preventDefault();
    if (submitting.current) return;
    if (!cartItems.length) {
      setError('Your cart is empty.');
      return;
    }
    submitting.current = true;
    setSubmittingState(true);
    setError('');
    try {
      const checkout = await orderAPI.checkout({
        checkoutKey: checkoutKey.current,
        paymentMethod,
        shippingAddress,
        contactPhone,
        contactEmail
      });
      if (!checkout.paymentRequired) {
        await finishOrder(checkout);
        return;
      }

      await loadRazorpay();
      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.order.amount,
        currency: checkout.order.currency,
        name: 'MultiCart',
        description: `Order ${checkout.order.id}`,
        order_id: checkout.order.id,
        prefill: { name: shippingAddress.name, email: contactEmail, contact: contactPhone },
        theme: { color: '#2563eb' },
        handler: async paymentResponse => {
          try {
            const result = await orderAPI.verifyPayment({ checkoutKey: checkoutKey.current, ...paymentResponse });
            await finishOrder(result);
          } catch (verificationError) {
            if (verificationError.data?.paymentCaptured) {
              checkoutKey.current = createCheckoutKey();
              await validateCart().catch(() => {});
            }
            setError(verificationError.message || 'Payment verification failed. Do not retry payment until the status is checked.');
          } finally {
            submitting.current = false;
            setSubmittingState(false);
          }
        },
        modal: {
          ondismiss: () => {
            submitting.current = false;
            setSubmittingState(false);
          }
        }
      });
      razorpay.on('payment.failed', response => {
        setError(response?.error?.description || 'Payment failed. No order has been placed. You can retry the same checkout.');
        submitting.current = false;
        setSubmittingState(false);
      });
      razorpay.open();
    } catch (requestError) {
      if (requestError.data?.code === 'STOCK_CHANGED') {
        checkoutKey.current = createCheckoutKey();
        const validation = await validateCart().catch(() => null);
        if (validation) setCartValidation(validation);
      }
      setError(requestError.message || 'Unable to place your order. Check the cart and try again.');
      submitting.current = false;
      setSubmittingState(false);
    }
  };

  const unavailable = cartValidation && cartValidation.success === false;

  if (isSyncing || loading) {
    return <div className="mx-auto max-w-4xl px-4 py-24 text-center text-slate-500">Loading secure checkout…</div>;
  }
  if (!cartItems.length) {
    return <div className="mx-auto max-w-2xl px-4 py-24 text-center"><PackageCheck className="mx-auto mb-5 h-12 w-12 text-blue-600" /><h1 className="text-2xl font-black text-slate-900">Your cart is empty</h1><Link to="/products" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Browse products</Link></div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/cart" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
      <div className="mb-8 flex items-center gap-3"><div className="rounded-2xl bg-blue-100 p-3 text-blue-700"><ShieldCheck className="h-6 w-6" /></div><div><h1 className="text-3xl font-black text-slate-900">Secure checkout</h1><p className="text-sm text-slate-500">One checkout, with fulfillment split by vendor.</p></div></div>

      {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
      {unavailable && <div role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Some items are unavailable. <Link to="/cart" className="font-bold underline">Return to cart</Link> and remove or adjust them.</div>}

      <form onSubmit={handlePlaceOrder} className="grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="space-y-7">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3"><MapPin className="h-5 w-5 text-blue-600" /><div><h2 className="text-lg font-black text-slate-900">Delivery address</h2><p className="text-xs text-slate-500">Required for every vendor shipment.</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {addressFields.map(([field, label, type]) => (
                <label key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
                  <input required type={type} value={shippingAddress[field] || ''} onChange={event => updateAddress(field, event.target.value)} maxLength={field === 'street' ? 200 : 100} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              ))}
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Contact phone</span><input required type="tel" value={contactPhone} onChange={event => setContactPhone(event.target.value)} maxLength={20} autoComplete="tel" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600">Contact email</span><input required type="email" value={contactEmail} onChange={event => setContactEmail(event.target.value)} maxLength={254} autoComplete="email" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center gap-3"><CreditCard className="h-5 w-5 text-blue-600" /><div><h2 className="text-lg font-black text-slate-900">Payment method</h2><p className="text-xs text-slate-500">Payment card details are handled only by Razorpay Checkout.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mt-1 accent-blue-600" /><span><strong className="block text-sm text-slate-900">Cash on Delivery</strong><small className="text-xs text-slate-500">Pay your delivery partner.</small></span></label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${paymentMethod === 'razorpay' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'} ${!paymentOptions.razorpay ? 'cursor-not-allowed opacity-50' : ''}`}><input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} disabled={!paymentOptions.razorpay} onChange={() => setPaymentMethod('razorpay')} className="mt-1 accent-blue-600" /><span><strong className="block text-sm text-slate-900">Razorpay test mode</strong><small className="text-xs text-slate-500">{paymentOptions.razorpay ? 'UPI, card and net banking via Razorpay.' : 'Unavailable until test credentials are configured.'}</small></span></label>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> MultiCart never stores card numbers, CVV, or bank credentials.</p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">
          <h2 className="mb-5 border-b border-slate-100 pb-4 text-lg font-black text-slate-900">Order summary</h2>
          <div className="mb-5 max-h-64 space-y-4 overflow-y-auto">
            {itemsByVendor.map(vendor => <div key={vendor.vendorId} className="space-y-2"><div className="flex items-center gap-2 text-xs font-bold text-slate-700"><Truck className="h-4 w-4 text-blue-600" />{vendor.vendorName}</div>{vendor.items.map(item => <div key={item.id} className="flex justify-between gap-3 pl-6 text-xs text-slate-500"><span>{item.name} × {item.quantity}</span><span className="shrink-0 font-semibold text-slate-800">{formatINR(item.price * item.quantity)}</span></div>)}</div>)}
          </div>
          <div className="space-y-3 border-t border-slate-100 pt-4 text-sm"><div className="flex justify-between text-slate-600"><span>Items ({totalItemsCount})</span><span>{formatINR(subtotal)}</span></div><div className="flex justify-between text-slate-600"><span>Delivery</span><span>{shippingFee ? formatINR(shippingFee) : 'Free'}</span></div><div className="flex justify-between border-t border-slate-100 pt-4 text-base font-black text-slate-900"><span>Payable</span><span>{formatINR(grandTotal)}</span></div></div>
          <button type="submit" disabled={submittingState || Boolean(unavailable) || !cartItems.length} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" />{submittingState ? 'Processing…' : paymentMethod === 'cod' ? 'Place order' : 'Continue to Razorpay'}</button>
          <p className="mt-4 text-center text-[11px] leading-5 text-slate-500">Your payable amount is recalculated on the server from current catalog prices and inventory before the order is accepted.</p>
        </aside>
      </form>
    </div>
  );
};

export default Checkout;
