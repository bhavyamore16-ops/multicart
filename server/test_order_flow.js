import crypto from 'crypto';
import mongoose from 'mongoose';
import app from './src/app.js';
import MongooseOrder from './src/models/Order.js';
import MongooseCheckoutSession from './src/models/CheckoutSession.js';
import {
  MemoryCategory,
  MemoryOrder,
  MemoryProduct,
  MemoryUser,
  MemoryVendorProfile
} from './src/config/memoryStore.js';
import { generateToken } from './src/utils/generateToken.js';

const server = app.listen(0);
await new Promise(resolve => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
let passed = 0;
let failed = 0;

const assert = (condition, label) => {
  if (condition) { passed += 1; console.log(`  ✓ PASS: ${label}`); }
  else { failed += 1; console.error(`  ✗ FAIL: ${label}`); }
};

const identity = async (name, role, status = 'approved') => {
  const suffix = `${Date.now()}-${Math.random()}`;
  const user = await MemoryUser.create({ name, email: `${name.toLowerCase().replace(/\s+/g, '.')}.${suffix}@orders.test`, password: 'TestPassword@123', role });
  let profile = null;
  if (role === 'vendor') {
    profile = await MemoryVendorProfile.create({ userId: user._id, storeName: `${name} Shop`, status, isVerified: status === 'approved' });
  }
  return { user, profile, token: generateToken(user._id, role) };
};

const request = (path, { token, method = 'GET', body, headers = {} } = {}) => fetch(`${baseUrl}${path}`, {
  method,
  headers: {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  },
  body: body === undefined ? undefined : JSON.stringify(body)
});

const read = async response => ({ status: response.status, body: await response.json() });
const address = {
  shippingAddress: {
    name: 'Taylor Customer',
    street: '42 Market Road',
    city: 'Pune',
    state: 'Maharashtra',
    postalCode: '411001',
    country: 'India'
  },
  contactPhone: '+91 9876543210'
};

try {
  const mongoRefs = {
    customer: new mongoose.Types.ObjectId(),
    vendor: new mongoose.Types.ObjectId(),
    product: new mongoose.Types.ObjectId(),
    checkout: new mongoose.Types.ObjectId()
  };
  const schemaOrder = new MongooseOrder({
    masterOrderId: 'MC-MONGOOSE-SCHEMA-ORDER', checkoutSession: mongoRefs.checkout,
    customer: mongoRefs.customer, vendor: mongoRefs.vendor,
    items: [{ product: mongoRefs.product, vendor: mongoRefs.vendor, name: 'Schema product', price: 100, quantity: 1, subtotal: 100 }],
    subtotal: 100, shippingCost: 150, total: 250, masterSubtotal: 100, masterShippingCost: 150, masterTotal: 250,
    paymentStatus: 'pending', paymentMethod: 'cod', paymentProvider: 'cod',
    shippingAddress: { name: 'Test User', street: '42 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India', phone: '+919876543210' },
    contactEmail: 'test@example.com', contactPhone: '+919876543210'
  });
  try { await schemaOrder.validate(); assert(true, 'Mongo order schema validates vendor-specific order and contact/payment metadata'); }
  catch { assert(false, 'Mongo order schema validates vendor-specific order and contact/payment metadata'); }
  const schemaCheckout = new MongooseCheckoutSession({
    customer: mongoRefs.customer, checkoutKey: 'mongoose-schema-checkout-001', masterOrderId: 'MC-MONGOOSE-SCHEMA-CHECKOUT',
    paymentMethod: 'razorpay', status: 'pending_payment',
    items: [{ product: mongoRefs.product, vendor: mongoRefs.vendor, name: 'Schema product', price: 100, quantity: 1, subtotal: 100 }],
    subtotal: 100, shippingCost: 150, total: 250,
    shippingAddress: { name: 'Test User', street: '42 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'India', phone: '+919876543210' },
    contactEmail: 'test@example.com', contactPhone: '+919876543210'
  });
  try { await schemaCheckout.validate(); assert(true, 'Mongo checkout-session schema supports a pending Razorpay test checkout'); }
  catch { assert(false, 'Mongo checkout-session schema supports a pending Razorpay test checkout'); }

  const category = await MemoryCategory.create({ name: `Order Test ${Date.now()}` });
  const vendorA = await identity('Vendor A', 'vendor');
  const vendorB = await identity('Vendor B', 'vendor');
  const customer = await identity('Order Customer', 'customer');
  const otherCustomer = await identity('Other Order Customer', 'customer');
  const concurrentCustomer = await identity('Concurrent Order Customer', 'customer');
  const admin = await identity('Order Admin', 'admin');

  const itemA = await MemoryProduct.create({
    name: 'Vendor A Product', description: 'A test product', price: 1000, discountPercent: 10,
    stock: 4, category: category._id, vendor: vendorA.user._id, vendorProfile: vendorA.profile._id,
    thumbnail: 'https://example.test/a.jpg', isAvailable: true, isApproved: true
  });
  const itemB = await MemoryProduct.create({
    name: 'Vendor B Product', description: 'B test product', price: 700, discountPercent: 0,
    stock: 3, category: category._id, vendor: vendorB.user._id, vendorProfile: vendorB.profile._id,
    thumbnail: 'https://example.test/b.jpg', isAvailable: true, isApproved: true
  });

  console.log('--- PHASE 6 ORDER FLOW SUITE ---');
  let result = await read(await request('/checkout/options', { token: customer.token }));
  assert(result.status === 200 && result.body.paymentMethods.cod && result.body.paymentMethods.razorpay === false, 'Checkout exposes COD and disables Razorpay without test credentials');
  result = await read(await request('/checkout/options', { token: vendorA.token }));
  assert(result.status === 403, 'Only customer accounts can access customer checkout options');
  result = await read(await request('/checkout', { token: customer.token, method: 'POST', body: { paymentMethod: 'cod', ...address } }));
  assert(result.status === 400, 'Checkout requires an idempotency key');
  result = await read(await request('/checkout', { token: customer.token, method: 'POST', body: { checkoutKey: 'empty-cart-001', paymentMethod: 'cod', ...address } }));
  assert(result.status === 400 && result.body.message.includes('empty'), 'Checkout rejects an empty cart');

  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: itemA._id, quantity: 1 } });
  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: itemB._id, quantity: 1 } });
  result = await read(await request('/checkout', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'multi-vendor-checkout-001', paymentMethod: 'cod', ...address }
  }));
  const placedOrders = result.body.orders || [];
  assert(result.status === 201 && placedOrders.length === 2, 'One checkout creates one vendor-specific order for each vendor');
  assert(placedOrders.every(order => order.items.length === 1 && order.items[0].vendor === order.vendor._id), 'Each sub-order contains only its vendor’s own product lines');
  assert(placedOrders.reduce((sum, order) => sum + order.total, 0) === 1750 && placedOrders.every(order => order.masterTotal === 1750), 'Discount, delivery charge, and master total reconcile across vendor orders');
  assert(placedOrders.every(order => order.status === 'pending' && order.paymentStatus === 'pending' && order.paymentMethod === 'cod'), 'COD orders start pending vendor confirmation and payment');
  assert(itemA.stock === 3 && itemB.stock === 2 && itemA.totalSales === 1 && itemB.totalSales === 1, 'Inventory is deducted exactly once when the order is placed');
  assert(placedOrders.every(order => order.shippingAddress.city === 'Pune' && order.contactPhone === address.contactPhone && order.contactEmail === customer.user.email), 'Orders retain shipping, phone, and email contact details');
  assert(placedOrders.every(order => !('cardNumber' in order) && !('cvv' in order)), 'Order records contain no card details');

  result = await read(await request('/checkout', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'multi-vendor-checkout-001', paymentMethod: 'cod', ...address }
  }));
  assert(result.status === 200 && result.body.idempotent && result.body.orders.length === 2 && itemA.stock === 3 && itemB.stock === 2, 'Retrying the same checkout key returns existing orders without another stock deduction');
  result = await read(await request('/cart', { token: customer.token }));
  assert(result.status === 200 && result.body.items.length === 0, 'Successful checkout consumes the purchased quantities from the customer cart');

  result = await read(await request('/orders', { token: customer.token }));
  assert(result.status === 200 && result.body.count === 2, 'Customer order history returns both vendor shipments');
  const otherHistory = await read(await request('/orders', { token: otherCustomer.token }));
  assert(otherHistory.status === 200 && otherHistory.body.count === 0, 'Customer order history is isolated by account');
  const vendorOrdersA = await read(await request('/orders', { token: vendorA.token }));
  const vendorOrdersB = await read(await request('/orders', { token: vendorB.token }));
  assert(vendorOrdersA.status === 200 && vendorOrdersA.body.count === 1 && vendorOrdersA.body.orders[0].items.every(item => item.vendor === vendorA.user._id), 'Vendor order queue exposes only that vendor’s shipment lines');
  assert(vendorOrdersB.status === 200 && vendorOrdersB.body.count === 1 && vendorOrdersB.body.orders[0].items.every(item => item.vendor === vendorB.user._id), 'Each vendor receives an independent order queue');
  result = await read(await request(`/orders/${placedOrders[1]._id}`, { token: vendorA.token }));
  assert(result.status === 404, 'A vendor cannot view another vendor’s sub-order');
  result = await read(await request(`/orders/${placedOrders[0]._id}`, { token: otherCustomer.token }));
  assert(result.status === 404, 'A customer cannot view another customer’s order details');

  result = await read(await request(`/orders/${placedOrders[0]._id}/decision`, { token: vendorA.token, method: 'POST', body: { action: 'accept' } }));
  assert(result.status === 200 && result.body.order.status === 'confirmed', 'Vendor can accept its pending order');
  result = await read(await request(`/orders/${placedOrders[0]._id}/status`, { token: vendorA.token, method: 'PATCH', body: { status: 'shipped' } }));
  assert(result.status === 409, 'Vendor cannot skip required fulfillment states');
  result = await read(await request(`/orders/${placedOrders[0]._id}/status`, { token: vendorA.token, method: 'PATCH', body: { status: 'processing' } }));
  assert(result.status === 200 && result.body.order.status === 'processing', 'Vendor can move an accepted order into processing');
  result = await read(await request(`/orders/${placedOrders[0]._id}/status`, { token: vendorA.token, method: 'PATCH', body: { status: 'shipped', courier: 'Test Courier', trackingNumber: 'TRK-ORDER-001' } }));
  assert(result.status === 200 && result.body.order.status === 'shipped' && result.body.order.trackingNumber === 'TRK-ORDER-001', 'Vendor can attach shipment details and mark the order shipped');
  result = await read(await request(`/orders/${placedOrders[0]._id}/status`, { token: vendorA.token, method: 'PATCH', body: { status: 'delivered' } }));
  assert(result.status === 200 && result.body.order.status === 'delivered' && result.body.order.statusHistory.length >= 4 && result.body.order.paymentStatus === 'paid', 'Vendor can mark delivery, update COD settlement, and record each status');
  result = await read(await request(`/orders/${placedOrders[0]._id}/cancel`, { token: customer.token, method: 'POST', body: {} }));
  assert(result.status === 409, 'Customer cannot cancel an order after it has shipped or been delivered');

  result = await read(await request(`/orders/${placedOrders[1]._id}/decision`, { token: vendorB.token, method: 'POST', body: { action: 'reject', reason: 'Unable to fulfill' } }));
  assert(result.status === 200 && result.body.order.status === 'cancelled' && itemB.stock === 3 && itemB.totalSales === 0, 'Vendor rejection cancels its sub-order and restores only its inventory');
  result = await read(await request(`/orders/${placedOrders[1]._id}/decision`, { token: vendorB.token, method: 'POST', body: { action: 'reject' } }));
  assert(result.status === 409 && itemB.stock === 3, 'A rejected order cannot be rejected or restocked twice');

  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: itemA._id, quantity: 1 } });
  const cancelCheckout = await read(await request('/checkout', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'customer-cancel-checkout-001', paymentMethod: 'cod', ...address }
  }));
  const cancellable = cancelCheckout.body.orders?.[0];
  assert(cancelCheckout.status === 201 && cancellable && itemA.stock === 2, 'A second valid checkout reserves its own stock');
  result = await read(await request(`/orders/${cancellable._id}/cancel`, { token: customer.token, method: 'POST', body: {} }));
  assert(result.status === 200 && result.body.order.status === 'cancelled' && itemA.stock === 3 && itemA.totalSales === 1, 'Customer cancellation restores reserved inventory exactly once');
  result = await read(await request(`/orders/${cancellable._id}/cancel`, { token: customer.token, method: 'POST', body: {} }));
  assert(result.status === 200 && result.body.idempotent && itemA.stock === 3, 'Repeating a cancellation is idempotent');

  await request('/cart/items', { token: concurrentCustomer.token, method: 'POST', body: { productId: itemB._id, quantity: 1 } });
  const concurrentResults = await Promise.all([
    request('/checkout', { token: concurrentCustomer.token, method: 'POST', body: { checkoutKey: 'concurrent-checkout-001', paymentMethod: 'cod', ...address } }),
    request('/checkout', { token: concurrentCustomer.token, method: 'POST', body: { checkoutKey: 'concurrent-checkout-001', paymentMethod: 'cod', ...address } })
  ]);
  const concurrentBodies = await Promise.all(concurrentResults.map(read));
  assert(concurrentBodies.filter(entry => entry.status === 201).length === 1 && concurrentBodies.every(entry => [200, 201, 409].includes(entry.status)) && itemB.stock === 2, 'Concurrent duplicate checkout attempts create at most one order and deduct stock once');

  await request('/cart/items', { token: otherCustomer.token, method: 'POST', body: { productId: itemA._id, quantity: 1 } });
  const adminManagedCheckout = await read(await request('/checkout', {
    token: otherCustomer.token,
    method: 'POST',
    body: { checkoutKey: 'admin-managed-checkout-001', paymentMethod: 'cod', ...address }
  }));
  assert(adminManagedCheckout.status === 201 && itemA.stock === 2, 'Another customer can place an independent order from available inventory');

  result = await read(await request('/admin/orders', { token: admin.token }));
  assert(result.status === 200 && result.body.count === 5, 'Admin can view all vendor-specific orders');
  result = await read(await request('/admin/orders/transactions', { token: admin.token }));
  assert(result.status === 200 && result.body.count === 5 && result.body.transactions.every(tx => tx.currency === 'INR' && tx.paymentMethod === 'cod'), 'Admin transaction monitoring exposes amount and payment status without sensitive payment data');
  const adminTarget = (await read(await request('/admin/orders', { token: admin.token }))).body.orders.find(order => order.status === 'pending')._id;
  result = await read(await request(`/admin/orders/${adminTarget}/status`, { token: admin.token, method: 'PATCH', body: { status: 'confirmed' } }));
  assert(result.status === 200 && result.body.order.status === 'confirmed', 'Admin can advance eligible order status');
  result = await read(await request(`/admin/orders/${adminTarget}/status`, { token: vendorA.token, method: 'PATCH', body: { status: 'processing' } }));
  assert(result.status === 403, 'Non-admin accounts cannot use admin order status controls');

  result = await read(await request('/checkout', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'razorpay-unavailable-001', paymentMethod: 'razorpay', ...address }
  }));
  assert(result.status === 503 && itemA.stock === 2, 'Razorpay checkout fails closed when test credentials are unavailable');
  result = await read(await request('/checkout/verify', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'razorpay-unavailable-001', razorpay_order_id: 'order_fake', razorpay_payment_id: 'pay_fake', razorpay_signature: 'invalid' }
  }));
  assert([400, 404].includes(result.status), 'Unmatched or invalid Razorpay payment callbacks cannot create orders');

  const previousFetch = globalThis.fetch;
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const razorpayOrderAmounts = new Map();
  const razorpayOrderByPayment = new Map();
  const refundCalls = [];
  let razorpayOrderCount = 0;
  globalThis.fetch = async (input, options = {}) => {
    const url = String(input);
    if (!url.startsWith('https://api.razorpay.com/v1/')) return previousFetch(input, options);
    const path = url.slice('https://api.razorpay.com/v1'.length);
    const method = options.method || 'GET';
    if (path === '/orders' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const id = `order_test_${++razorpayOrderCount}`;
      razorpayOrderAmounts.set(id, { amount: body.amount, currency: body.currency });
      return new Response(JSON.stringify({ id, amount: body.amount, currency: body.currency, status: 'created' }), { status: 200 });
    }
    const paymentMatch = path.match(/^\/payments\/([^/]+)$/);
    if (paymentMatch && method === 'GET') {
      const paymentId = decodeURIComponent(paymentMatch[1]);
      const orderId = razorpayOrderByPayment.get(paymentId);
      const amount = razorpayOrderAmounts.get(orderId);
      return new Response(JSON.stringify({ id: paymentId, order_id: orderId, amount: amount?.amount, currency: amount?.currency, status: 'captured' }), { status: 200 });
    }
    const refundMatch = path.match(/^\/payments\/([^/]+)\/refund$/);
    if (refundMatch && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      refundCalls.push({ paymentId: decodeURIComponent(refundMatch[1]), amount: body.amount });
      return new Response(JSON.stringify({ id: `rfnd_test_${refundCalls.length}`, status: 'processed' }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: { description: `Unexpected mock Razorpay request: ${method} ${path}` } }), { status: 404 });
  };
  process.env.RAZORPAY_KEY_ID = 'rzp_test_order_suite';
  process.env.RAZORPAY_KEY_SECRET = 'order-suite-test-secret';
  try {
    const razorpayCustomer = await identity('Razorpay Customer', 'customer');
    const razorpayProduct = await MemoryProduct.create({
      name: 'Razorpay Test Product', description: 'Mocked online payment product', price: 500,
      stock: 2, category: category._id, vendor: vendorA.user._id, vendorProfile: vendorA.profile._id
    });
    await request('/cart/items', { token: razorpayCustomer.token, method: 'POST', body: { productId: razorpayProduct._id, quantity: 1 } });
    await request('/cart/items', { token: razorpayCustomer.token, method: 'POST', body: { productId: itemB._id, quantity: 1 } });
    const razorpayStart = await read(await request('/checkout', {
      token: razorpayCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-checkout-valid-001', paymentMethod: 'razorpay', ...address }
    }));
    assert(razorpayStart.status === 201 && razorpayStart.body.paymentRequired && razorpayStart.body.order.amount === 135000 && razorpayProduct.stock === 2 && itemB.stock === 2, 'Razorpay test-mode order uses server-calculated INR paise and waits for payment before stock deduction');
    const beforePayment = await read(await request('/orders', { token: razorpayCustomer.token }));
    assert(beforePayment.body.count === 0, 'Razorpay order initialization alone does not create a purchasable vendor order');

    const paymentId = 'pay_test_checkout_001';
    razorpayOrderByPayment.set(paymentId, razorpayStart.body.order.id);
    const invalid = await read(await request('/checkout/verify', {
      token: razorpayCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-checkout-valid-001', razorpay_order_id: razorpayStart.body.order.id, razorpay_payment_id: paymentId, razorpay_signature: 'invalid' }
    }));
    assert(invalid.status === 400 && razorpayProduct.stock === 2, 'Invalid Razorpay signatures cannot create orders or change inventory');

    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpayStart.body.order.id}|${paymentId}`).digest('hex');
    const paid = await read(await request('/checkout/verify', {
      token: razorpayCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-checkout-valid-001', razorpay_order_id: razorpayStart.body.order.id, razorpay_payment_id: paymentId, razorpay_signature: signature }
    }));
    assert(paid.status === 201 && paid.body.orders.length === 2 && paid.body.orders.every(order => order.paymentStatus === 'paid') && razorpayProduct.stock === 1 && itemB.stock === 1, 'One verified Razorpay payment creates paid vendor sub-orders and deducts each vendor inventory');
    const repeatedPayment = await read(await request('/checkout/verify', {
      token: razorpayCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-checkout-valid-001', razorpay_order_id: razorpayStart.body.order.id, razorpay_payment_id: paymentId, razorpay_signature: signature }
    }));
    assert(repeatedPayment.status === 200 && repeatedPayment.body.idempotent && repeatedPayment.body.orders.length === 2 && razorpayProduct.stock === 1 && itemB.stock === 1, 'Repeated payment callbacks return the existing order group without duplicate fulfillment');
    const transactionResult = await read(await request('/admin/orders/transactions', { token: admin.token }));
    const paymentTransaction = transactionResult.body.transactions.find(transaction => transaction.razorpayPaymentId === paymentId);
    assert(paymentTransaction?.orderCount === 2 && paymentTransaction.amount === 1350 && transactionResult.body.transactions.filter(transaction => transaction.razorpayPaymentId === paymentId).length === 1, 'Admin transaction monitoring records one gateway payment for the multi-vendor order group');

    const raceCustomer = await identity('Razorpay Stock Race Customer', 'customer');
    const raceProduct = await MemoryProduct.create({
      name: 'Razorpay Stock Race Product', description: 'Inventory changed during payment', price: 300,
      stock: 1, category: category._id, vendor: vendorB.user._id, vendorProfile: vendorB.profile._id
    });
    await request('/cart/items', { token: raceCustomer.token, method: 'POST', body: { productId: raceProduct._id, quantity: 1 } });
    const raceStart = await read(await request('/checkout', {
      token: raceCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-stock-race-001', paymentMethod: 'razorpay', ...address }
    }));
    const racePaymentId = 'pay_test_stock_race_001';
    razorpayOrderByPayment.set(racePaymentId, raceStart.body.order.id);
    raceProduct.stock = 0;
    const raceSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${raceStart.body.order.id}|${racePaymentId}`).digest('hex');
    const raceResult = await read(await request('/checkout/verify', {
      token: raceCustomer.token,
      method: 'POST',
      body: { checkoutKey: 'razorpay-stock-race-001', razorpay_order_id: raceStart.body.order.id, razorpay_payment_id: racePaymentId, razorpay_signature: raceSignature }
    }));
    assert(raceResult.status === 409 && raceResult.body.paymentCaptured && raceResult.body.refundStatus === 'refunded' && refundCalls.some(call => call.paymentId === racePaymentId), 'Captured payment is automatically refunded when stock becomes unavailable before confirmation');
    assert(raceProduct.stock === 0, 'Failed paid checkout never creates a negative stock balance');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret;
  }

  await request('/cart/items', { token: otherCustomer.token, method: 'POST', body: { productId: itemA._id, quantity: 1 } });
  await request('/cart/items', { token: customer.token, method: 'POST', body: { productId: itemA._id, quantity: 2 } });
  itemA.stock = 0;
  result = await read(await request('/checkout', {
    token: customer.token,
    method: 'POST',
    body: { checkoutKey: 'stock-checkout-invalid-001', paymentMethod: 'cod', ...address }
  }));
  assert(result.status === 409 && itemA.stock === 0, 'Checkout cannot place a quantity that exceeds current stock');

  console.log(`--- RESULT: ${passed} passed, ${failed} failed ---`);
} catch (error) {
  failed += 1;
  console.error('  ✗ FAIL: suite crashed:', error);
} finally {
  await new Promise(resolve => server.close(resolve));
}

if (failed) process.exitCode = 1;
