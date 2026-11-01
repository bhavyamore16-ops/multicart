import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, BarChart3, Check, CheckCircle2, Clock3,
  CreditCard, DollarSign, LayoutDashboard, LoaderCircle, Package, Pencil,
  Mail, RefreshCw, Search, ShieldCheck, ShoppingBag, Store, Tags, Trash2, Users,
  X, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, categoryAPI, orderAPI, productAPI } from '../services/api';

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'messages', label: 'Customer messages', icon: Mail },
  { id: 'reports', label: 'Sales reports', icon: BarChart3 }
];

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
const getId = value => value?._id?.toString?.() || value?.id?.toString?.() || value?.toString?.() || '';
const dateText = value => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const statusTone = status => ({
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  suspended: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-rose-50 text-rose-700 ring-rose-200',
  refunded: 'bg-violet-50 text-violet-700 ring-violet-200',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200'
}[String(status || '').toLowerCase()] || 'bg-slate-100 text-slate-600 ring-slate-200');

function Badge({ children, tone }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${tone || statusTone(children)}`}>{children}</span>;
}

function EmptyState({ title, detail = 'There is nothing to display here yet.' }) {
  return <div className="px-6 py-14 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Package size={20} /></div><p className="font-bold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}

function MetricCard({ label, value, detail, icon: Icon, accent = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700', violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700', slate: 'bg-slate-100 text-slate-700'
  };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{value}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[accent]}`}><Icon size={20} /></span></div>
    {detail && <p className="mt-3 text-xs text-slate-500">{detail}</p>}
  </div>;
}

function Section({ title, detail, action, children }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-extrabold text-slate-900">{title}</h2>{detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}</div>{action}</div>
    {children}
  </section>;
}

function Table({ columns, rows, emptyTitle, emptyDetail, minWidth = '760px' }) {
  if (!rows.length) return <EmptyState title={emptyTitle || 'No records found'} detail={emptyDetail} />;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm" style={{ minWidth }}>
    <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500"><tr>{columns.map(column => <th className={`px-5 py-3 ${column.align === 'right' ? 'text-right' : ''}`} key={column.key}>{column.label}</th>)}</tr></thead>
    <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={row.key || row.id || index} className="hover:bg-slate-50/70">{columns.map(column => <td key={column.key} className={`px-5 py-3.5 align-middle text-slate-700 ${column.align === 'right' ? 'text-right' : ''}`}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody>
  </table></div>;
}

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState({});
  const [reports, setReports] = useState({ monthlySales: [], bestSellingProducts: [], topVendors: [] });
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [productEditor, setProductEditor] = useState(null);
  const [categoryEditor, setCategoryEditor] = useState(null);
  const [categoryDraft, setCategoryDraft] = useState({ name: '', description: '', icon: '🛍️', displayOrder: 0, isActive: true });
  const [orderEdits, setOrderEdits] = useState({});
  const [messageEditor, setMessageEditor] = useState(null);

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');
    try {
      const [overviewResult, reportsResult, vendorsResult, usersResult, productsResult, categoriesResult, ordersResult, transactionsResult, messagesResult] = await Promise.all([
        adminAPI.getOverview(), adminAPI.getReports(), adminAPI.getVendors(), adminAPI.getUsers(),
        productAPI.getAllAdmin(), categoryAPI.getAllAdmin(), orderAPI.getAdminOrders(), orderAPI.getAdminTransactions(), adminAPI.getMessages()
      ]);
      setOverview(overviewResult.overview || {});
      setReports(reportsResult.reports || { monthlySales: [], bestSellingProducts: [], topVendors: [] });
      setVendors(vendorsResult.vendors || []);
      setUsers(usersResult.users || []);
      setProducts(productsResult.products || []);
      setCategories(categoriesResult.categories || []);
      setOrders(ordersResult.orders || []);
      setTransactions(transactionsResult.transactions || []);
      setMessages(messagesResult.messages || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load administrator data.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const usersById = useMemo(() => new Map(users.map(item => [getId(item), item])), [users]);
  const categoriesById = useMemo(() => new Map(categories.map(item => [getId(item), item])), [categories]);
  const maxMonthlySales = Math.max(1, ...(reports.monthlySales || []).map(item => Number(item.sales || 0)));
  const search = query.trim().toLowerCase();
  const filteredVendors = vendors.filter(item => [item.storeName, item.businessEmail, item.user?.name, item.user?.email, item.status].some(value => String(value || '').toLowerCase().includes(search)));
  const filteredCustomers = users.filter(item => item.role === 'customer' && [item.name, item.email, item.phone].some(value => String(value || '').toLowerCase().includes(search)));
  const filteredProducts = products.filter(item => [item.name, item.description, item.vendor?.name, item.category?.name].some(value => String(value || '').toLowerCase().includes(search)));
  const filteredCategories = categories.filter(item => [item.name, item.description].some(value => String(value || '').toLowerCase().includes(search)));
  const filteredOrders = orders.filter(item => [item.orderNumber, item.customer?.name, item.customer?.email, item.vendor?.name, item.status].some(value => String(value || '').toLowerCase().includes(search)));
  const filteredMessages = messages.filter(item => [item.name, item.email, item.subject, item.message, item.status].some(value => String(value || '').toLowerCase().includes(search)));

  const runAction = async (key, action, successText) => {
    setBusyKey(key); setError(''); setNotice('');
    try {
      await action();
      setNotice(successText);
      await loadDashboard({ quiet: true });
      return true;
    } catch (actionError) {
      setError(actionError.message || 'The update could not be completed.');
      return false;
    } finally { setBusyKey(''); }
  };

  const updateVendor = (vendor, status) => {
    let rejectionReason = '';
    if (status === 'rejected') {
      rejectionReason = window.prompt('Enter a rejection reason:', 'Application did not meet verification requirements.');
      if (rejectionReason === null) return;
    }
    return runAction(`vendor-${getId(vendor)}`, () => adminAPI.updateVendorStatus(getId(vendor), {
      status,
      ...(status === 'rejected' ? { rejectionReason: rejectionReason.trim() || 'Application rejected by administrator.' } : {})
    }), `Vendor marked ${status}.`);
  };

  const toggleUser = userItem => runAction(`user-${getId(userItem)}`, () => adminAPI.toggleUserStatus(getId(userItem)), `Customer account ${userItem.isActive ? 'deactivated' : 'activated'}.`);

  const saveProduct = async event => {
    event.preventDefault();
    if (!productEditor) return;
    const id = getId(productEditor);
    const payload = {
      name: productEditor.name,
      description: productEditor.description,
      price: Number(productEditor.price),
      discountPercent: Number(productEditor.discountPercent || 0),
      stock: Number(productEditor.stock),
      category: getId(productEditor.category),
      isAvailable: Boolean(productEditor.isAvailable),
      isApproved: Boolean(productEditor.isApproved)
    };
    setBusyKey(`product-${id}`); setError(''); setNotice('');
    try {
      await productAPI.updateAdmin(id, payload);
      setProductEditor(null);
      setNotice('Product updated successfully.');
      await loadDashboard({ quiet: true });
    } catch (saveError) { setError(saveError.message || 'Product could not be updated.'); }
    finally { setBusyKey(''); }
  };

  const openProductEditor = product => setProductEditor({
    ...product,
    category: getId(product.category),
    isAvailable: product.isAvailable !== false,
    isApproved: product.isApproved !== false
  });

  const submitCategory = async event => {
    event.preventDefault();
    const payload = { ...categoryDraft, displayOrder: Number(categoryDraft.displayOrder || 0) };
    const id = categoryEditor ? getId(categoryEditor) : '';
    await runAction(`category-${id || 'new'}`, async () => {
      if (categoryEditor) await categoryAPI.update(id, payload);
      else await categoryAPI.create(payload);
      setCategoryEditor(null);
      setCategoryDraft({ name: '', description: '', icon: '🛍️', displayOrder: 0, isActive: true });
    }, categoryEditor ? 'Category updated.' : 'Category created.');
  };

  const startCategoryEdit = category => {
    setCategoryEditor(category);
    setCategoryDraft({ name: category.name || '', description: category.description || '', icon: category.icon || '🛍️', displayOrder: category.displayOrder || 0, isActive: category.isActive !== false });
  };

  const saveOrderStatus = order => {
    const status = orderEdits[getId(order)] || order.status;
    return runAction(`order-${getId(order)}`, () => orderAPI.updateAdminStatus(getId(order), { status }), `Order ${order.orderNumber || ''} updated.`);
  };

  const saveSupportMessage = event => {
    event.preventDefault();
    if (!messageEditor) return;
    return runAction(`message-${getId(messageEditor)}`, () => adminAPI.updateMessage(getId(messageEditor), {
      status: messageEditor.status,
      adminReply: messageEditor.adminReply
    }), 'Support message updated.').then(saved => { if (saved) setMessageEditor(null); });
  };

  const displayUser = value => {
    if (value && typeof value === 'object') {
      if (value.name || value.email) return value.name || value.email;
      const matched = usersById.get(getId(value));
      return matched?.name || matched?.email || '—';
    }
    const matched = usersById.get(getId(value));
    return matched?.name || matched?.email || String(value || '—');
  };
  const displayVendor = product => {
    if (product.vendor && typeof product.vendor === 'object') return product.vendor.name || product.vendor.email || 'Vendor';
    return displayUser(product.vendor);
  };
  const displayCategory = product => {
    if (product.category && typeof product.category === 'object') return product.category.name || '—';
    return categoriesById.get(getId(product.category))?.name || '—';
  };

  return <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-7 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
      <div><div className="mb-2 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white"><ShieldCheck size={19} /></span><span className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700">MultiCart control center</span></div><h1 className="text-3xl font-black tracking-tight text-slate-950">Administrator dashboard</h1><p className="mt-1 text-sm text-slate-500">Platform operations, marketplace health and fulfillment oversight.</p></div>
      <div className="flex flex-wrap items-center gap-3"><div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-500">Signed in as <span className="font-bold text-slate-800">{user?.name || user?.email || 'Administrator'}</span></div><button onClick={() => loadDashboard()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />} Refresh data</button></div>
    </div>

    {error && <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}<button onClick={() => setError('')} className="ml-auto"><X size={16} /></button></div>}
    {notice && <div role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><CheckCircle2 size={17} />{notice}<button onClick={() => setNotice('')} className="ml-auto"><X size={16} /></button></div>}

    <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setActiveTab(id); setQuery(''); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon size={16} />{label}</button>)}
    </div>

    {loading && <div className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500"><LoaderCircle size={17} className="animate-spin" />Loading live platform data…</div>}

    {activeTab === 'overview' && <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Registered customers" value={overview.totalCustomers ?? '—'} icon={Users} accent="blue" detail="Customer accounts on the platform" />
        <MetricCard label="Registered vendors" value={overview.totalVendors ?? '—'} icon={Store} accent="violet" detail={`${overview.approvedVendors || 0} approved to sell`} />
        <MetricCard label="Pending applications" value={overview.pendingVendors ?? '—'} icon={Clock3} accent="amber" detail="Vendor applications awaiting review" />
        <MetricCard label="Approved vendors" value={overview.approvedVendors ?? '—'} icon={CheckCircle2} accent="emerald" detail="Active vendor storefronts" />
        <MetricCard label="Total products" value={overview.totalProducts ?? '—'} icon={Package} accent="slate" detail="All vendor listings" />
        <MetricCard label="Total orders" value={overview.totalOrders ?? '—'} icon={ShoppingBag} accent="blue" detail="Vendor fulfillment orders" />
        <MetricCard label="Total revenue" value={money(overview.totalRevenue)} icon={DollarSign} accent="emerald" detail="Paid orders, excluding cancelled orders" />
        <MetricCard label="Categories" value={overview.totalCategories ?? '—'} icon={Tags} accent="rose" detail="Product catalog categories" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Section title="Monthly sales" detail="Revenue from paid orders, excluding cancelled orders · last 12 months">
          <div className="space-y-3 p-5">{(reports.monthlySales || []).map(item => <div key={item.month} className="grid grid-cols-[40px_1fr_100px] items-center gap-3 text-xs"><span className="font-semibold text-slate-500">{item.label}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.max(item.sales ? 3 : 0, Number(item.sales || 0) / maxMonthlySales * 100)}%` }} /></div><span className="text-right font-bold text-slate-800">{money(item.sales)}</span></div>)}{!reports.monthlySales?.length && <EmptyState title="Sales data is not available" />}</div>
        </Section>
        <Section title="Recent orders" detail="Latest customer checkouts" action={<button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-blue-700 hover:text-blue-900">View all</button>}>
          <div className="divide-y divide-slate-100">{orders.slice(0, 5).map(order => <div key={getId(order)} className="flex items-center justify-between gap-4 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{order.orderNumber || `Order ${getId(order).slice(-7)}`}</p><p className="mt-0.5 truncate text-xs text-slate-500">{displayUser(order.customer)} · {dateText(order.createdAt)}</p></div><div className="shrink-0 text-right"><p className="text-sm font-extrabold text-slate-900">{money(order.total)}</p><div className="mt-1"><Badge>{order.status}</Badge></div></div></div>)}{!orders.length && <EmptyState title="No orders yet" />}</div>
        </Section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Best-selling products" detail="Ranked by units sold from completed payments">
          <Table minWidth="500px" columns={[{ key: 'name', label: 'Product', render: row => <span className="font-bold text-slate-900">{row.name}</span> }, { key: 'quantity', label: 'Units sold', align: 'right' }, { key: 'revenue', label: 'Revenue', align: 'right', render: row => money(row.revenue) }]} rows={reports.bestSellingProducts || []} emptyTitle="No completed product sales" />
        </Section>
        <Section title="Top vendors" detail="Ranked by completed order revenue">
          <Table minWidth="460px" columns={[{ key: 'storeName', label: 'Vendor', render: row => <span className="font-bold text-slate-900">{row.storeName}</span> }, { key: 'sales', label: 'Sales', align: 'right', render: row => money(row.sales) }]} rows={reports.topVendors || []} emptyTitle="No vendor sales to report" />
        </Section>
      </div>
    </div>}

    {activeTab === 'vendors' && <Section title="Vendor management" detail="Review applications, approve stores or suspend vendor access." action={<span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{vendors.filter(v => v.status === 'pending').length} awaiting review</span>}>
      <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search stores, applicants or status" /></div>
      <Table columns={[
        { key: 'store', label: 'Store', render: vendor => <><span className="font-extrabold text-slate-900">{vendor.storeName}</span><span className="mt-1 block text-xs text-slate-500">Applied {dateText(vendor.createdAt)}</span></> },
        { key: 'applicant', label: 'Applicant', render: vendor => <><span className="font-semibold text-slate-800">{vendor.user?.name || 'Vendor account'}</span><span className="mt-1 block text-xs text-slate-500">{vendor.user?.email || vendor.businessEmail || '—'}</span><span className="block text-xs text-slate-500">{vendor.businessPhone || vendor.user?.phone || ''}</span></> },
        { key: 'address', label: 'Business address', render: vendor => <span className="block max-w-xs truncate text-xs text-slate-600" title={vendor.businessAddress}>{vendor.businessAddress || '—'}</span> },
        { key: 'status', label: 'Status', render: vendor => <Badge>{vendor.status}</Badge> },
        { key: 'actions', label: 'Actions', align: 'right', render: vendor => <div className="flex justify-end gap-2">{vendor.status !== 'approved' && <ActionButton label="Approve" icon={Check} disabled={busyKey === `vendor-${getId(vendor)}`} onClick={() => updateVendor(vendor, 'approved')} color="green" />}{vendor.status === 'pending' && <ActionButton label="Reject" icon={XCircle} disabled={busyKey === `vendor-${getId(vendor)}`} onClick={() => updateVendor(vendor, 'rejected')} color="red" />}{vendor.status === 'approved' ? <ActionButton label="Suspend" icon={Activity} disabled={busyKey === `vendor-${getId(vendor)}`} onClick={() => updateVendor(vendor, 'suspended')} color="slate" /> : vendor.status === 'suspended' ? <ActionButton label="Reinstate" icon={CheckCircle2} disabled={busyKey === `vendor-${getId(vendor)}`} onClick={() => updateVendor(vendor, 'approved')} color="green" /> : null}</div> }
      ]} rows={filteredVendors.map(vendor => ({ ...vendor, key: getId(vendor) }))} emptyTitle="No vendors found" emptyDetail="Vendor profiles will appear here when sellers apply." />
    </Section>}

    {activeTab === 'customers' && <Section title="Customer accounts" detail="Review customer account details and control access to the platform.">
      <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search customer name, email or phone" /></div>
      <Table columns={[
        { key: 'customer', label: 'Customer', render: item => <><span className="font-bold text-slate-900">{item.name || 'Customer'}</span><span className="mt-1 block text-xs text-slate-500">{item.email}</span></> },
        { key: 'phone', label: 'Contact', render: item => item.phone || '—' },
        { key: 'createdAt', label: 'Joined', render: item => dateText(item.createdAt) },
        { key: 'status', label: 'Account status', render: item => <Badge tone={statusTone(item.isActive ? 'active' : 'inactive')}>{item.isActive ? 'Active' : 'Inactive'}</Badge> },
        { key: 'actions', label: 'Actions', align: 'right', render: item => <button onClick={() => toggleUser(item)} disabled={busyKey === `user-${getId(item)}`} className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${item.isActive ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>{item.isActive ? 'Deactivate' : 'Activate'}</button> }
      ]} rows={filteredCustomers.map(item => ({ ...item, key: getId(item) }))} emptyTitle="No customers found" />
    </Section>}

    {activeTab === 'products' && <Section title="Product catalog" detail="Moderate listings, edit product information or remove products from the catalog." action={<span className="text-xs text-slate-500">{products.length} listings</span>}>
      <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search products, vendors or categories" /></div>
      <Table minWidth="980px" columns={[
        { key: 'product', label: 'Product', render: item => <div className="flex items-center gap-3"><img src={item.thumbnail || item.images?.[0] || '/placeholder-product.png'} alt="" className="h-11 w-11 rounded-xl bg-slate-100 object-cover" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} /><div><span className="font-bold text-slate-900">{item.name}</span><span className="mt-1 block max-w-[240px] truncate text-xs text-slate-500">{displayVendor(item)}</span></div></div> },
        { key: 'category', label: 'Category', render: item => displayCategory(item) },
        { key: 'price', label: 'Price', align: 'right', render: item => <><span className="font-bold text-slate-900">{money(item.price)}</span>{Number(item.discountPercent) > 0 && <span className="block text-xs text-emerald-700">{item.discountPercent}% off</span>}</> },
        { key: 'stock', label: 'Stock', align: 'right', render: item => <span className={Number(item.stock) < 5 ? 'font-bold text-amber-700' : ''}>{item.stock ?? 0}</span> },
        { key: 'listing', label: 'Listing', render: item => <div className="flex flex-col items-start gap-1"><Badge>{item.isApproved === false ? 'rejected' : 'approved'}</Badge><span className={`text-[11px] ${item.isAvailable === false ? 'text-slate-400' : 'text-emerald-700'}`}>{item.isAvailable === false ? 'Unavailable' : 'Available'}</span></div> },
        { key: 'actions', label: 'Actions', align: 'right', render: item => <div className="flex justify-end gap-2"><ActionButton label="Edit" icon={Pencil} onClick={() => openProductEditor(item)} color="blue" /><ActionButton label="Delete" icon={Trash2} disabled={busyKey === `product-delete-${getId(item)}`} onClick={() => { if (window.confirm(`Delete “${item.name}” from the catalog?`)) runAction(`product-delete-${getId(item)}`, () => productAPI.removeAdmin(getId(item)), 'Product deleted.'); }} color="red" /></div> }
      ]} rows={filteredProducts.map(item => ({ ...item, key: getId(item) }))} emptyTitle="No products found" />
    </Section>}

    {activeTab === 'categories' && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Section title="Product categories" detail="Control category visibility and ordering in the customer catalog." action={<span className="text-xs text-slate-500">{categories.length} categories</span>}>
        <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search categories" /></div>
        <Table minWidth="650px" columns={[
          { key: 'category', label: 'Category', render: item => <><span className="font-bold text-slate-900">{item.icon || '🛍️'} {item.name}</span><span className="mt-1 block text-xs text-slate-500">{item.description || 'No description'}</span></> },
          { key: 'order', label: 'Order', align: 'right', render: item => item.displayOrder ?? 0 },
          { key: 'status', label: 'Visibility', render: item => <Badge tone={statusTone(item.isActive ? 'active' : 'inactive')}>{item.isActive ? 'Visible' : 'Hidden'}</Badge> },
          { key: 'actions', label: 'Actions', align: 'right', render: item => <div className="flex justify-end gap-2"><ActionButton label="Edit" icon={Pencil} onClick={() => startCategoryEdit(item)} color="blue" /><ActionButton label="Delete" icon={Trash2} disabled={busyKey === `category-delete-${getId(item)}`} onClick={() => { if (window.confirm(`Delete category “${item.name}”?`)) runAction(`category-delete-${getId(item)}`, () => categoryAPI.remove(getId(item)), 'Category deleted.'); }} color="red" /></div> }
        ]} rows={filteredCategories.map(item => ({ ...item, key: getId(item) }))} emptyTitle="No categories found" />
      </Section>
      <Section title={categoryEditor ? 'Edit category' : 'Add a category'} detail={categoryEditor ? 'Update category details and visibility.' : 'Create a new catalog category.'}>
        <form onSubmit={submitCategory} className="space-y-4 p-5">
          <Field label="Category name"><input required maxLength={80} value={categoryDraft.name} onChange={event => setCategoryDraft({ ...categoryDraft, name: event.target.value })} className={inputClass} placeholder="e.g. Home & Living" /></Field>
          <Field label="Description"><textarea maxLength={500} rows={3} value={categoryDraft.description} onChange={event => setCategoryDraft({ ...categoryDraft, description: event.target.value })} className={inputClass} placeholder="Short customer-facing description" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Icon"><input maxLength={8} value={categoryDraft.icon} onChange={event => setCategoryDraft({ ...categoryDraft, icon: event.target.value })} className={inputClass} /></Field><Field label="Display order"><input type="number" min="0" step="1" value={categoryDraft.displayOrder} onChange={event => setCategoryDraft({ ...categoryDraft, displayOrder: event.target.value })} className={inputClass} /></Field></div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={categoryDraft.isActive} onChange={event => setCategoryDraft({ ...categoryDraft, isActive: event.target.checked })} className="rounded border-slate-300 text-blue-600" />Visible to customers</label>
          <div className="flex gap-2"><button disabled={busyKey === `category-${categoryEditor ? getId(categoryEditor) : 'new'}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"><Check size={16} />{categoryEditor ? 'Save changes' : 'Create category'}</button>{categoryEditor && <button type="button" onClick={() => { setCategoryEditor(null); setCategoryDraft({ name: '', description: '', icon: '🛍️', displayOrder: 0, isActive: true }); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
        </form>
      </Section>
    </div>}

    {activeTab === 'orders' && <Section title="Order management" detail="Review customer orders and administer their fulfillment status." action={<span className="text-xs text-slate-500">{orders.length} orders</span>}>
      <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search order number, customer, vendor or status" /></div>
      <Table minWidth="1050px" columns={[
        { key: 'order', label: 'Order', render: item => <><span className="font-bold text-slate-900">{item.orderNumber || getId(item)}</span><span className="mt-1 block text-xs text-slate-500">{dateText(item.createdAt)}</span></> },
        { key: 'customer', label: 'Customer', render: item => displayUser(item.customer) },
        { key: 'vendor', label: 'Vendor', render: item => displayUser(item.vendor) },
        { key: 'amount', label: 'Amount', align: 'right', render: item => money(item.total) },
        { key: 'payment', label: 'Payment', render: item => <><span className="block font-semibold uppercase text-slate-700">{item.paymentMethod || '—'}</span><span className="mt-1 block"><Badge>{item.paymentStatus}</Badge></span></> },
        { key: 'status', label: 'Order status', render: item => <div className="flex items-center gap-2"><Badge>{item.status}</Badge><select value={orderEdits[getId(item)] || item.status} onChange={event => setOrderEdits({ ...orderEdits, [getId(item)]: event.target.value })} className="max-w-[130px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold capitalize"><option value={item.status}>{item.status}</option>{orderStatuses.filter(status => status !== item.status).map(status => <option key={status} value={status}>{status}</option>)}</select></div> },
        { key: 'action', label: '', align: 'right', render: item => <button onClick={() => saveOrderStatus(item)} disabled={busyKey === `order-${getId(item)}` || (orderEdits[getId(item)] || item.status) === item.status} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40">Save status</button> }
      ]} rows={filteredOrders.map(item => ({ ...item, key: getId(item) }))} emptyTitle="No orders found" />
    </Section>}

    {activeTab === 'payments' && <Section title="Payment monitoring" detail="Payment status, order settlement and gateway reference monitoring." action={<span className="text-xs text-slate-500">{transactions.length} transactions</span>}>
      <Table minWidth="1050px" columns={[
        { key: 'reference', label: 'Reference', render: item => <><span className="font-bold text-slate-900">{item.orderNumber || item.masterOrderId || 'Checkout attempt'}</span><span className="mt-1 block text-xs text-slate-500">{dateText(item.createdAt)}</span></> },
        { key: 'amount', label: 'Amount', align: 'right', render: item => money(item.amount) },
        { key: 'method', label: 'Method', render: item => <span className="font-semibold uppercase">{item.paymentMethod || '—'}</span> },
        { key: 'payment', label: 'Payment status', render: item => <Badge>{item.paymentStatus}</Badge> },
        { key: 'fulfillment', label: 'Order status', render: item => <Badge>{item.orderStatus || '—'}</Badge> },
        { key: 'gateway', label: 'Gateway reference', render: item => <span className="font-mono text-xs text-slate-500">{item.razorpayPaymentId ? `…${item.razorpayPaymentId.slice(-8)}` : item.razorpayOrderId ? `Order …${item.razorpayOrderId.slice(-8)}` : '—'}</span> },
        { key: 'refund', label: 'Refund', render: item => <Badge>{item.refundStatus || 'none'}</Badge> }
      ]} rows={transactions.map((item, index) => ({ ...item, key: item.masterOrderId || item.orderId || index }))} emptyTitle="No transactions found" emptyDetail="Payment activity will appear here after checkouts." />
    </Section>}

    {activeTab === 'messages' && <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Section title="Customer support inbox" detail="Read messages submitted through the contact form and manage support replies." action={<span className="text-xs font-bold text-slate-500">{messages.filter(item => item.status === 'new').length} new</span>}>
        <div className="border-b border-slate-100 p-4"><SearchInput value={query} onChange={setQuery} placeholder="Search contact, subject or message" /></div>
        <Table minWidth="740px" columns={[
          { key: 'sender', label: 'From', render: item => <><span className="font-bold text-slate-900">{item.name}</span><span className="mt-1 block text-xs text-slate-500">{item.email}</span></> },
          { key: 'subject', label: 'Subject', render: item => <><span className="font-semibold text-slate-800">{item.subject}</span><span className="mt-1 block max-w-xs truncate text-xs text-slate-500">{item.message}</span></> },
          { key: 'date', label: 'Received', render: item => dateText(item.createdAt) },
          { key: 'status', label: 'Status', render: item => <Badge tone={item.status === 'new' ? 'bg-amber-50 text-amber-700 ring-amber-200' : item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}>{item.status?.replace('_', ' ')}</Badge> },
          { key: 'actions', label: '', align: 'right', render: item => <div className="flex justify-end gap-2"><ActionButton label="Review" icon={Mail} onClick={() => setMessageEditor({ ...item })} color="blue" /><ActionButton label="Delete" icon={Trash2} onClick={() => { if (window.confirm('Delete this support message?')) runAction(`message-delete-${getId(item)}`, () => adminAPI.deleteMessage(getId(item)), 'Support message deleted.'); }} color="red" /></div> }
        ]} rows={filteredMessages.map(item => ({ ...item, key: getId(item) }))} emptyTitle="No customer messages" emptyDetail="Messages submitted through Contact Us will appear here." />
      </Section>
      <Section title={messageEditor ? 'Review message' : 'Message details'} detail={messageEditor ? `Received ${dateText(messageEditor.createdAt)}` : 'Choose a message from the inbox to view and reply.'}>
        {messageEditor ? <form onSubmit={saveSupportMessage} className="space-y-4 p-5"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">From</p><p className="mt-1 break-all text-sm font-semibold text-slate-900">{messageEditor.name} · {messageEditor.email}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Subject</p><p className="mt-1 text-sm font-semibold text-slate-900">{messageEditor.subject}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">Message</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{messageEditor.message}</p></div><Field label="Status"><select value={messageEditor.status} onChange={event => setMessageEditor({ ...messageEditor, status: event.target.value })} className={inputClass}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></Field><Field label="Reply for customer"><textarea rows={5} maxLength={5000} value={messageEditor.adminReply || ''} onChange={event => setMessageEditor({ ...messageEditor, adminReply: event.target.value })} className={inputClass} placeholder="Write a response to display in the customer’s support history" /></Field><div className="flex gap-2"><button disabled={busyKey === `message-${getId(messageEditor)}`} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"><Check size={16} />Save response</button><button type="button" onClick={() => setMessageEditor(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Close</button></div></form> : <EmptyState title="Select a customer message" detail="The message and response form will open here." />}
      </Section>
    </div>}

    {activeTab === 'reports' && <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3"><MetricCard label="Total sales" value={money(reports.totalSales)} icon={DollarSign} accent="emerald" detail="Paid orders, excluding cancelled orders" /><MetricCard label="Total orders" value={reports.totalOrders ?? overview.totalOrders ?? 0} icon={ShoppingBag} accent="blue" detail={`${reports.paidSalesOrders || 0} orders recognized as sales`} /><MetricCard label="Sales periods" value={reports.monthlySales?.length || 0} icon={BarChart3} accent="violet" detail="Monthly sales points available" /></div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Monthly sales report" detail="Revenue by calendar month in INR">
          <div className="space-y-4 p-5">{(reports.monthlySales || []).map(item => <div key={item.month} className="grid grid-cols-[62px_1fr_120px] items-center gap-3"><span className="text-xs font-bold text-slate-500">{item.label}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${Math.max(item.sales ? 3 : 0, Number(item.sales || 0) / maxMonthlySales * 100)}%` }} /></div><span className="text-right text-sm font-extrabold text-slate-800">{money(item.sales)}</span></div>)}{!reports.monthlySales?.length && <EmptyState title="No monthly sales data" />}</div>
        </Section>
        <Section title="Top vendors" detail="Highest revenue from paid sales">
          <Table columns={[{ key: 'storeName', label: 'Vendor', render: item => <span className="font-bold text-slate-900">{item.storeName}</span> }, { key: 'sales', label: 'Total sales', align: 'right', render: item => money(item.sales) }]} rows={reports.topVendors || []} emptyTitle="No vendor sales to report" />
        </Section>
      </div>
      <Section title="Best-selling products" detail="Products ordered by completed units sold">
        <Table columns={[{ key: 'name', label: 'Product', render: item => <span className="font-bold text-slate-900">{item.name}</span> }, { key: 'quantity', label: 'Units sold', align: 'right' }, { key: 'price', label: 'Current price', align: 'right', render: item => money(item.price) }, { key: 'revenue', label: 'Completed sales', align: 'right', render: item => money(item.revenue) }]} rows={reports.bestSellingProducts || []} emptyTitle="No product sales to report" />
      </Section>
    </div>}

    {productEditor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="product-edit-heading">
      <form onSubmit={saveProduct} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4"><div><h2 id="product-edit-heading" className="text-lg font-black text-slate-950">Edit product</h2><p className="text-xs text-slate-500">Update catalog information and listing controls.</p></div><button type="button" onClick={() => setProductEditor(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></div>
        <div className="grid gap-4 p-6 sm:grid-cols-2"><Field label="Product name"><input required maxLength={200} value={productEditor.name || ''} onChange={event => setProductEditor({ ...productEditor, name: event.target.value })} className={inputClass} /></Field><Field label="Category"><select required value={productEditor.category || ''} onChange={event => setProductEditor({ ...productEditor, category: event.target.value })} className={inputClass}><option value="">Select category</option>{categories.map(category => <option value={getId(category)} key={getId(category)}>{category.name}</option>)}</select></Field><Field label="Price (INR)"><input type="number" min="0" step="0.01" required value={productEditor.price ?? ''} onChange={event => setProductEditor({ ...productEditor, price: event.target.value })} className={inputClass} /></Field><Field label="Discount percentage"><input type="number" min="0" max="100" step="0.1" value={productEditor.discountPercent ?? 0} onChange={event => setProductEditor({ ...productEditor, discountPercent: event.target.value })} className={inputClass} /></Field><Field label="Stock quantity"><input type="number" min="0" step="1" required value={productEditor.stock ?? 0} onChange={event => setProductEditor({ ...productEditor, stock: event.target.value })} className={inputClass} /></Field><div className="space-y-3 pt-2"><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(productEditor.isApproved)} onChange={event => setProductEditor({ ...productEditor, isApproved: event.target.checked })} className="rounded border-slate-300 text-blue-600" />Approved for sale</label><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(productEditor.isAvailable)} onChange={event => setProductEditor({ ...productEditor, isAvailable: event.target.checked })} className="rounded border-slate-300 text-blue-600" />Available for purchase</label></div><div className="sm:col-span-2"><Field label="Description"><textarea required maxLength={3000} rows={4} value={productEditor.description || ''} onChange={event => setProductEditor({ ...productEditor, description: event.target.value })} className={inputClass} /></Field></div></div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setProductEditor(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button disabled={busyKey === `product-${getId(productEditor)}`} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"><Check size={16} />Save product</button></div>
      </form>
    </div>}
  </div>;
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

function Field({ label, children }) { return <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">{label}</span>{children}</label>; }
function SearchInput({ value, onChange, placeholder }) { return <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`${inputClass} pl-9`} /></div>; }
function ActionButton({ label, icon: Icon, onClick, color = 'blue', disabled }) {
  const palette = { blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100', green: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', red: 'bg-rose-50 text-rose-700 hover:bg-rose-100', slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200' };
  return <button onClick={onClick} disabled={disabled} title={label} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold disabled:opacity-50 ${palette[color]}`}><Icon size={14} />{label}</button>;
}

export default AdminDashboard;
