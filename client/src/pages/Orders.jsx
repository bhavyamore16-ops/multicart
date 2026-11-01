import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Package, RefreshCw, ShieldCheck, Truck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';

const price = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const statusLabel = value => String(value || 'pending').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const statusTone = status => ({
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-violet-100 text-violet-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800'
}[status] || 'bg-slate-100 text-slate-700');

const Orders = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('orders');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (id) {
        const response = await orderAPI.getOrder(id);
        setOrder(response.order);
      } else if (user?.role === 'admin') {
        const [orderResponse, transactionResponse] = await Promise.all([orderAPI.getAdminOrders(), orderAPI.getAdminTransactions()]);
        setOrders(orderResponse.orders || []);
        setTransactions(transactionResponse.transactions || []);
      } else {
        const response = await orderAPI.getOrders();
        setOrders(response.orders || []);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [id, user?.role]);

  useEffect(() => { load(); }, [load]);

  const perform = async action => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (requestError) {
      setError(requestError.message || 'The order could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  const updateVendorStatus = status => perform(() => orderAPI.updateVendorStatus(order._id, {
    status,
    courier,
    trackingNumber
  }));

  const updateAdminStatus = status => perform(() => orderAPI.updateAdminStatus(order._id, {
    status,
    courier,
    trackingNumber,
    note: 'Updated from the admin order console.'
  }));

  const listTitle = user?.role === 'vendor' ? 'Vendor orders' : user?.role === 'admin' ? 'Order and transaction management' : 'My orders';
  const listDescription = user?.role === 'vendor'
    ? 'Orders below contain only products assigned to your store.'
    : user?.role === 'admin'
      ? 'Review vendor sub-orders and payment transaction references.'
      : 'Track each vendor shipment, view order details, or cancel eligible orders.';

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-24 text-center text-slate-500">Loading orders…</div>;

  if (id && order) {
    const isCustomer = user?.role === 'customer';
    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'admin';
    const canCancel = isCustomer && ['pending', 'confirmed'].includes(order.status);
    const vendorNext = { confirmed: 'processing', processing: 'shipped', shipped: 'delivered' }[order.status];
    const adminNext = {
      pending: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      confirmed: ['processing', 'shipped', 'delivered', 'cancelled'],
      processing: ['shipped', 'delivered', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    }[order.status] || [];
    const shippingAddress = order.shippingAddress || {};

    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/orders" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> All orders</Link>
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
            <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Vendor sub-order · Master {order.masterOrderId}</p><h1 className="mt-1 text-2xl font-black text-slate-900">{order.orderNumber}</h1><p className="mt-1 text-sm text-slate-500">Placed {new Date(order.createdAt).toLocaleString()}</p></div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black ${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase text-slate-400">Vendor</span><p className="mt-1 font-bold text-slate-900">{order.vendor?.name || 'Store'}</p>{order.vendor?.email && <p className="text-xs text-slate-500">{order.vendor.email}</p>}</div>
            <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase text-slate-400">Payment</span><p className="mt-1 font-bold text-slate-900">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'} · {statusLabel(order.paymentStatus)}</p>{order.razorpayPaymentId && <p className="break-all text-xs text-slate-500">Payment ref: {order.razorpayPaymentId}</p>}</div>
            <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase text-slate-400">This vendor’s payable</span><p className="mt-1 text-xl font-black text-slate-900">{price(order.total)}</p><p className="text-xs text-slate-500">Master order total: {price(order.masterTotal)}</p></div>
          </div>

          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_300px]">
            <div>
              <h2 className="mb-3 font-black text-slate-900">Items in this vendor shipment</h2>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {(order.items || []).map(item => <div key={item.product} className="flex items-center justify-between gap-4 p-4"><div className="flex min-w-0 items-center gap-3">{item.thumbnail && <img src={item.thumbnail} alt="" className="h-14 w-14 rounded-xl bg-slate-100 object-cover" />}<div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500">Qty {item.quantity} · {price(item.price)} each</p></div></div><strong className="shrink-0 text-sm text-slate-900">{price(item.subtotal)}</strong></div>)}
                <div className="flex justify-between px-4 py-3 text-sm text-slate-600"><span>Delivery</span><span>{price(order.shippingCost)}</span></div>
                <div className="flex justify-between border-t border-slate-100 px-4 py-4 font-black text-slate-900"><span>Vendor order total</span><span>{price(order.total)}</span></div>
              </div>
            </div>
            <div>
              <h2 className="mb-3 font-black text-slate-900">Delivery & tracking</h2>
              <div className="rounded-2xl border border-slate-200 p-4 text-sm"><p className="font-bold text-slate-900">{shippingAddress.name}</p><p className="mt-1 text-slate-600">{shippingAddress.street}<br />{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />{shippingAddress.country}</p><p className="mt-2 text-slate-600">{order.contactPhone || shippingAddress.phone}</p>{order.contactEmail && <p className="break-all text-xs text-slate-600">{order.contactEmail}</p>}{order.courier && <p className="mt-4 text-xs text-slate-600">Courier: <strong>{order.courier}</strong></p>}{order.trackingNumber && <p className="break-all text-xs text-slate-600">Tracking: <strong>{order.trackingNumber}</strong></p>}</div>
              {order.statusHistory?.length > 0 && <div className="mt-5 space-y-3">{order.statusHistory.map((entry, index) => <div key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3 text-xs"><div className="mt-0.5 text-blue-600">{entry.status === 'delivered' ? <CheckCircle2 className="h-4 w-4" /> : entry.status === 'cancelled' ? <XCircle className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}</div><div><p className="font-bold text-slate-800">{statusLabel(entry.status)}</p><p className="text-slate-500">{entry.note || 'Status updated'} · {new Date(entry.at).toLocaleString()}</p></div></div>)}</div>}
            </div>
          </div>

          {(isVendor || isAdmin) && order.status !== 'cancelled' && order.status !== 'delivered' && (vendorNext || adminNext.length > 0) && <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="font-black text-slate-900">Fulfillment actions</h2>
            {(order.status === 'processing' || order.status === 'confirmed' || isAdmin) && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Courier<input value={courier} onChange={event => setCourier(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-600">Tracking number<input value={trackingNumber} onChange={event => setTrackingNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal" /></label></div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {isVendor && order.status === 'pending' && <><button disabled={busy} onClick={() => perform(() => orderAPI.vendorDecision(order._id, 'accept'))} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Accept order</button><button disabled={busy} onClick={() => perform(() => orderAPI.vendorDecision(order._id, 'reject', 'Rejected by vendor.'))} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Reject order</button></>}
              {isVendor && vendorNext && <button disabled={busy} onClick={() => updateVendorStatus(vendorNext)} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Mark {statusLabel(vendorNext)}</button>}
              {isAdmin && adminNext.map(next => <button key={next} disabled={busy} onClick={() => updateAdminStatus(next)} className={`rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50 ${next === 'cancelled' ? 'bg-rose-600' : 'bg-blue-600'}`}>Set {statusLabel(next)}</button>)}
            </div>
          </div>}

          {canCancel && <div className="mt-8 border-t border-slate-100 pt-6"><button disabled={busy} onClick={() => perform(() => orderAPI.cancel(order._id))} className="rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancel eligible order</button><p className="mt-2 text-xs text-slate-500">Cancellation is available before shipment. Online payments are refunded through Razorpay.</p></div>}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black text-slate-900">{listTitle}</h1><p className="mt-1 text-sm text-slate-500">{listDescription}</p></div><button onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
      {location.state?.placed && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" />Order {location.state.placed} placed. Vendors will confirm and fulfill their shipments.</div>}
      {error && <div role="alert" className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {user?.role === 'admin' && <div className="mb-6 flex gap-2 border-b border-slate-200"><button onClick={() => setActiveView('orders')} className={`px-4 py-3 text-sm font-bold ${activeView === 'orders' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500'}`}><Package className="mr-2 inline h-4 w-4" />Orders ({orders.length})</button><button onClick={() => setActiveView('transactions')} className={`px-4 py-3 text-sm font-bold ${activeView === 'transactions' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500'}`}><ShieldCheck className="mr-2 inline h-4 w-4" />Transactions ({transactions.length})</button></div>}

      {user?.role === 'admin' && activeView === 'transactions' ? <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Customer / vendor</th><th className="px-4 py-3">Method / status</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Gateway refs</th></tr></thead><tbody className="divide-y divide-slate-100">{transactions.map((transaction, index) => <tr key={`${transaction.orderId || transaction.masterOrderId}-${index}`}><td className="px-4 py-4"><p className="font-bold text-slate-900">{transaction.orderNumber || transaction.masterOrderId}</p><p className="text-slate-500">{transaction.type === 'checkout_attempt' ? 'Payment attempt' : `${transaction.orderCount ? `${transaction.orderCount} vendor order(s)` : 'Vendor order'} · ${statusLabel(transaction.orderStatus)}`}</p></td><td className="px-4 py-4 text-slate-600">{transaction.customer?.name || 'Customer'}<br />{Array.isArray(transaction.vendor) ? transaction.vendor.map(vendor => vendor?.name).filter(Boolean).join(', ') || 'Multiple vendors' : transaction.vendor?.name || '—'}</td><td className="px-4 py-4 text-slate-600">{String(transaction.paymentMethod).toUpperCase()}<br />{statusLabel(transaction.paymentStatus)}{transaction.refundedAmount > 0 && <><br />Refunded {price(transaction.refundedAmount)}</>}</td><td className="px-4 py-4 font-bold text-slate-900">{price(transaction.amount)}</td><td className="max-w-64 break-all px-4 py-4 text-slate-500">{transaction.razorpayPaymentId || transaction.razorpayOrderId || transaction.razorpayRefundId || '—'}</td></tr>)}</tbody></table></div></div> : null}

      {(!user || user.role !== 'admin' || activeView === 'orders') && <div className="space-y-4">{orders.map(current => <article key={current._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{current.orderNumber} · Master {current.masterOrderId}</p><h2 className="mt-1 text-lg font-black text-slate-900">{current.vendor?.name || 'Vendor shipment'}</h2><p className="mt-1 text-xs text-slate-500">{new Date(current.createdAt).toLocaleString()} · {(current.items || []).length} product line(s)</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${statusTone(current.status)}`}>{statusLabel(current.status)}</span><strong className="text-lg text-slate-900">{price(current.total)}</strong></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><p className="text-xs text-slate-600">{current.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'} · {statusLabel(current.paymentStatus)}{current.trackingNumber ? ` · Tracking ${current.trackingNumber}` : ''}</p><div className="flex gap-2">{user?.role === 'vendor' && current.status === 'pending' && <><button disabled={busy} onClick={() => perform(() => orderAPI.vendorDecision(current._id, 'accept'))} className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">Accept</button><button disabled={busy} onClick={() => perform(() => orderAPI.vendorDecision(current._id, 'reject', 'Rejected by vendor.'))} className="rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50">Reject</button></>}<button onClick={() => navigate(`/orders/${current._id}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50">View details &amp; track</button></div></div></article>)}
        {!orders.length && <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-slate-300" /><h2 className="text-lg font-black text-slate-900">No orders yet</h2><p className="mt-1 text-sm text-slate-500">Orders will appear here after checkout.</p>{user?.role === 'customer' && <Link to="/products" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">Browse products</Link>}</div>}</div>}
    </main>
  );
};

export default Orders;
