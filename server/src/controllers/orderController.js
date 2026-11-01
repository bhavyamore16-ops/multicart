import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  getCartModel,
  getCheckoutSessionModel,
  getOrderModel,
  getProductModel,
  getUserModel
} from '../models/dataAccess.js';
import { idOf, isProductFromApprovedVendor } from '../utils/productPresentation.js';
import { createUserNotification } from '../utils/notifications.js';
import {
  captureRazorpayPayment,
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayConfig,
  refundRazorpayPayment,
  verifyRazorpaySignature
} from '../utils/razorpay.js';

const isMongoConnected = () => mongoose.connection?.readyState === 1;
const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const statusValues = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const asPlain = value => value?.toObject ? value.toObject() : (value?.toJSON ? value.toJSON() : value);

const httpError = (message, status = 400, code = '', details = undefined) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

const validateCheckoutKey = value => typeof value === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(value);

const validateDeliveryDetails = (body, user) => {
  const source = body?.shippingAddress || {};
  const contactEmail = String(body?.contactEmail || user?.email || '').trim().toLowerCase();
  const address = {
    name: String(source.name || user?.name || '').trim(),
    street: String(source.street || '').trim(),
    city: String(source.city || '').trim(),
    state: String(source.state || '').trim(),
    postalCode: String(source.postalCode || '').trim(),
    country: String(source.country || 'India').trim(),
    phone: String(body?.contactPhone || source.phone || '').trim()
  };
  const digits = address.phone.replace(/\D/g, '');
  const errors = [];
  if (address.name.length < 2 || address.name.length > 100) errors.push('Enter a recipient name between 2 and 100 characters.');
  if (address.street.length < 5 || address.street.length > 200) errors.push('Enter a street address between 5 and 200 characters.');
  if (address.city.length < 2 || address.city.length > 100) errors.push('Enter a valid city.');
  if (address.state.length < 2 || address.state.length > 100) errors.push('Enter a valid state or region.');
  if (!/^[A-Za-z0-9 -]{3,12}$/.test(address.postalCode)) errors.push('Enter a valid postal code.');
  if (address.country.length < 2 || address.country.length > 80) errors.push('Enter a valid country.');
  if (digits.length < 10 || digits.length > 15) errors.push('Enter a valid contact phone number.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254) errors.push('Enter a valid contact email address.');
  return { address, contactEmail, errors };
};

const buildCheckoutSnapshot = async (customerId, address, contactEmail) => {
  const cart = await getCartModel().findOne({ customer: customerId });
  if (!cart?.items?.length) throw httpError('Your cart is empty.', 400, 'EMPTY_CART');

  const ProductModel = getProductModel();
  const groupsByVendor = new Map();
  const snapshotItems = [];
  const unavailable = [];
  for (const cartItem of cart.items) {
    const productId = idOf(cartItem.product);
    const quantity = Number(cartItem.quantity);
    const product = await ProductModel.findById(productId);
    const approved = product && await isProductFromApprovedVendor(product);
    if (!product || !approved || product.isAvailable === false || !Number.isInteger(quantity) || quantity < 1 || Number(product.stock) < quantity) {
      unavailable.push({ productId, name: product?.name || 'Product', requested: quantity, available: Number(product?.stock || 0) });
      continue;
    }

    const vendorId = idOf(product.vendor);
    const price = money(Math.round(Number(product.price) * (1 - Number(product.discountPercent || 0) / 100)));
    const item = {
      product: productId,
      vendor: vendorId,
      name: product.name,
      thumbnail: product.thumbnail || product.images?.[0] || '',
      price,
      discountPercent: Number(product.discountPercent || 0),
      quantity,
      subtotal: money(price * quantity)
    };
    snapshotItems.push(item);
    if (!groupsByVendor.has(vendorId)) groupsByVendor.set(vendorId, { vendor: vendorId, items: [], subtotal: 0, shippingCost: 0 });
    const group = groupsByVendor.get(vendorId);
    group.items.push(item);
    group.subtotal = money(group.subtotal + item.subtotal);
  }
  if (unavailable.length) throw httpError('Some items are no longer available in the requested quantities.', 409, 'STOCK_CHANGED', unavailable);

  const subtotal = money(snapshotItems.reduce((sum, item) => sum + item.subtotal, 0));
  const shippingCost = subtotal > 1999 || subtotal === 0 ? 0 : 150;
  const groups = [...groupsByVendor.values()].sort((a, b) => a.vendor.localeCompare(b.vendor));
  let allocatedShipping = 0;
  groups.forEach((group, index) => {
    group.shippingCost = index === groups.length - 1
      ? shippingCost - allocatedShipping
      : Math.floor(shippingCost * group.subtotal / (subtotal || 1));
    allocatedShipping += group.shippingCost;
  });

  return { items: snapshotItems, groups, subtotal, shippingCost, total: money(subtotal + shippingCost), shippingAddress: address, contactEmail, contactPhone: address.phone };
};

const orderGroupBySession = async sessionId => {
  const OrderModel = getOrderModel();
  let query = OrderModel.find({ checkoutSession: sessionId }).sort({ createdAt: 1 });
  if (isMongoConnected()) query = query.populate('vendor', 'name email');
  return await query;
};

const sendExistingCheckout = async (res, session) => {
  if (session.status === 'placed') {
    const orders = await orderGroupBySession(session._id);
    return res.status(200).json({
      success: true,
      idempotent: true,
      masterOrderId: session.masterOrderId,
      orders: orders.map(asPlain),
      total: session.total
    });
  }
  if (session.paymentMethod === 'razorpay' && session.status === 'pending_payment') {
    const { keyId, enabled } = getRazorpayConfig();
    if (!enabled) return res.status(503).json({ success: false, message: 'Razorpay test mode is no longer configured for this payment attempt.' });
    return res.status(200).json({
      success: true,
      paymentRequired: true,
      idempotent: true,
      keyId,
      order: { id: session.razorpayOrderId, amount: Math.round(session.total * 100), currency: 'INR' },
      checkoutKey: session.checkoutKey
    });
  }
  return res.status(409).json({ success: false, message: 'This checkout is already being processed or cannot be retried. Start a new checkout attempt.' });
};

const createOrLoadSession = async (customerId, checkoutKey, paymentMethod, snapshot, status) => {
  const SessionModel = getCheckoutSessionModel();
  const existing = await SessionModel.findOne({ customer: customerId, checkoutKey });
  if (existing) return { session: existing, created: false };
  const masterOrderId = `MC-${crypto.randomUUID().toUpperCase()}`;
  try {
    const session = await SessionModel.create({
      customer: customerId,
      checkoutKey,
      masterOrderId,
      paymentMethod,
      status,
      items: snapshot.items,
      subtotal: snapshot.subtotal,
      shippingCost: snapshot.shippingCost,
      total: snapshot.total,
      shippingAddress: snapshot.shippingAddress,
      contactEmail: snapshot.contactEmail,
      contactPhone: snapshot.contactPhone
    });
    return { session, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    return { session: await SessionModel.findOne({ customer: customerId, checkoutKey }), created: false };
  }
};

const adjustInventory = async (productId, quantityDelta, salesDelta = 0) => {
  const ProductModel = getProductModel();
  if (!isMongoConnected()) return ProductModel.adjustInventory(productId, quantityDelta, salesDelta);
  if (quantityDelta < 0) {
    const required = Math.abs(quantityDelta);
    return ProductModel.findOneAndUpdate({
      _id: productId,
      stock: { $gte: required },
      isAvailable: true,
      isApproved: true
    }, { $inc: { stock: quantityDelta, totalSales: salesDelta } }, { new: true });
  }
  return ProductModel.findByIdAndUpdate(productId, { $inc: { stock: quantityDelta, totalSales: salesDelta } }, { new: true });
};

const consumeCartItems = async (customerId, purchasedItems) => {
  const CartModel = getCartModel();
  const cart = await CartModel.findOne({ customer: customerId });
  if (!cart) return;
  const purchased = new Map(purchasedItems.map(item => [item.product.toString(), item.quantity]));
  const remaining = [];
  for (const item of cart.items || []) {
    const productId = idOf(item.product);
    const left = Number(item.quantity) - Number(purchased.get(productId) || 0);
    if (left > 0) remaining.push({ product: productId, quantity: left });
  }
  cart.items.splice(0, cart.items.length);
  remaining.forEach(item => cart.items.push(item));
  await cart.save();
};

const markSession = async (session, updates) => {
  const SessionModel = getCheckoutSessionModel();
  return SessionModel.findByIdAndUpdate(session._id, updates, { new: true, runValidators: true });
};

const placeSessionOrders = async (session, { paymentStatus = 'pending', paymentId = '' } = {}) => {
  const OrderModel = getOrderModel();
  const createdOrders = [];
  const newlyCreatedOrders = [];
  const deductions = [];
  try {
    const groups = new Map();
    for (const item of session.items) {
      const vendorId = idOf(item.vendor);
      if (!groups.has(vendorId)) groups.set(vendorId, { vendor: vendorId, items: [], subtotal: 0, shippingCost: 0 });
      const group = groups.get(vendorId);
      group.items.push(item);
      group.subtotal = money(group.subtotal + Number(item.subtotal));
    }
    const vendors = [...groups.values()].sort((a, b) => a.vendor.localeCompare(b.vendor));
    let shippingAllocated = 0;
    vendors.forEach((group, index) => {
      group.shippingCost = index === vendors.length - 1
        ? Number(session.shippingCost) - shippingAllocated
        : Math.floor(Number(session.shippingCost) * group.subtotal / (Number(session.subtotal) || 1));
      shippingAllocated += group.shippingCost;
    });

    for (const group of vendors) {
      let existing = await OrderModel.findOne({ checkoutSession: session._id, vendor: group.vendor });
      if (existing) {
        createdOrders.push(existing);
        continue;
      }
      const groupDeductions = [];
      for (const item of group.items) {
        const product = await adjustInventory(item.product, -Number(item.quantity), Number(item.quantity));
        if (!product) throw httpError(`Stock changed for ${item.name}; checkout was not placed.`, 409, 'STOCK_CHANGED');
        const deduction = { product: item.product, quantity: Number(item.quantity) };
        deductions.push(deduction);
        groupDeductions.push(deduction);
      }
      try {
        const order = await OrderModel.create({
          masterOrderId: session.masterOrderId,
          checkoutSession: session._id,
          customer: session.customer,
          vendor: group.vendor,
          items: group.items,
          subtotal: group.subtotal,
          shippingCost: group.shippingCost,
          total: money(group.subtotal + group.shippingCost),
          masterSubtotal: session.subtotal,
          masterShippingCost: session.shippingCost,
          masterTotal: session.total,
          status: 'pending',
          statusHistory: [{ status: 'pending', role: 'system', note: 'Order placed; awaiting vendor confirmation.' }],
          paymentStatus,
          paymentMethod: session.paymentMethod,
          paymentProvider: session.paymentMethod,
          razorpayOrderId: session.razorpayOrderId || '',
          razorpayPaymentId: paymentId,
          shippingAddress: session.shippingAddress,
          contactEmail: session.contactEmail,
          contactPhone: session.contactPhone
        });
        createdOrders.push(order);
        newlyCreatedOrders.push(order);
      } catch (error) {
        if (error.code === 11000) {
          for (const deduction of groupDeductions) {
            await adjustInventory(deduction.product, deduction.quantity, -deduction.quantity);
            deductions.splice(deductions.indexOf(deduction), 1);
          }
          existing = await OrderModel.findOne({ checkoutSession: session._id, vendor: group.vendor });
          if (existing) {
            createdOrders.push(existing);
            continue;
          }
        }
        throw error;
      }
    }

    const updated = await markSession(session, { status: 'placed', orderIds: createdOrders.map(order => order._id), razorpayPaymentId: paymentId });
    await consumeCartItems(session.customer, session.items);
    if (newlyCreatedOrders.length) {
      await createUserNotification(session.customer, {
        type: 'order_confirmation',
        title: 'Order confirmed',
        message: `${session.masterOrderId} was placed successfully.`,
        href: '/orders'
      });
      await Promise.all(newlyCreatedOrders.map(order => createUserNotification(order.vendor, {
        type: 'new_order',
        title: 'New customer order',
        message: `Order ${order.orderNumber} is awaiting your review.`,
        href: '/vendor/dashboard'
      })));
    }
    return { session: updated || session, orders: createdOrders };
  } catch (error) {
    await OrderModel.deleteMany({ checkoutSession: session._id });
    for (const deduction of deductions) await adjustInventory(deduction.product, deduction.quantity, -deduction.quantity);
    await markSession(session, { status: 'payment_failed', failureReason: error.message });
    throw error;
  }
};

const formatOrder = async value => {
  const order = asPlain(value);
  if (!order) return order;
  const UserModel = getUserModel();
  if (typeof order.vendor === 'string' || !order.vendor?.name) {
    const vendor = await UserModel.findById(idOf(order.vendor));
    if (vendor) order.vendor = { _id: idOf(vendor._id), name: vendor.name, email: vendor.email };
  }
  if (typeof order.customer === 'string' || !order.customer?.name) {
    const customer = await UserModel.findById(idOf(order.customer));
    if (customer) order.customer = { _id: idOf(customer._id), name: customer.name, email: customer.email, phone: customer.phone };
  }
  return order;
};

export const getCheckoutOptions = async (req, res) => {
  const config = getRazorpayConfig();
  res.json({ success: true, currency: 'INR', paymentMethods: { cod: true, razorpay: config.enabled }, razorpayKeyId: config.enabled ? config.keyId : '' });
};

export const createCheckout = async (req, res) => {
  try {
    const checkoutKey = String(req.body?.checkoutKey || req.get('Idempotency-Key') || '');
    const paymentMethod = String(req.body?.paymentMethod || 'cod').toLowerCase();
    if (!validateCheckoutKey(checkoutKey)) return res.status(400).json({ success: false, message: 'A valid idempotency key is required for checkout.' });
    if (!['cod', 'razorpay'].includes(paymentMethod)) return res.status(400).json({ success: false, message: 'Choose Cash on Delivery or Razorpay.' });
    const priorSession = await getCheckoutSessionModel().findOne({ customer: req.user._id, checkoutKey });
    if (priorSession) {
      if (priorSession.paymentMethod !== paymentMethod) return res.status(409).json({ success: false, message: 'This checkout key was already used for another payment method.' });
      return sendExistingCheckout(res, priorSession);
    }
    if (paymentMethod === 'razorpay' && !getRazorpayConfig().enabled) {
      return res.status(503).json({ success: false, message: 'Razorpay test mode is unavailable. Configure RAZORPAY_KEY_ID with an rzp_test_ key and RAZORPAY_KEY_SECRET, or choose Cash on Delivery.' });
    }

    const { address, contactEmail, errors } = validateDeliveryDetails(req.body, req.user);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });
    const snapshot = await buildCheckoutSnapshot(req.user._id, address, contactEmail);
    const { session, created } = await createOrLoadSession(req.user._id, checkoutKey, paymentMethod, snapshot, paymentMethod === 'cod' ? 'processing' : 'creating_payment');
    if (!created) return sendExistingCheckout(res, session);

    if (paymentMethod === 'cod') {
      const { session: placed, orders } = await placeSessionOrders(session, { paymentStatus: 'pending' });
      return res.status(201).json({ success: true, masterOrderId: placed.masterOrderId, orders: await Promise.all(orders.map(formatOrder)), total: placed.total });
    }

    const { keyId } = getRazorpayConfig();
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amount: Math.round(snapshot.total * 100),
        currency: 'INR',
        receipt: session.masterOrderId.slice(0, 40),
        notes: { checkout_reference: session.masterOrderId }
      });
    } catch (error) {
      await markSession(session, { status: 'payment_failed', failureReason: error.message });
      throw error;
    }
    await markSession(session, {
      status: 'pending_payment',
      razorpayOrderId: razorpayOrder.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });
    return res.status(201).json({
      success: true,
      paymentRequired: true,
      keyId,
      checkoutKey,
      order: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency }
    });
  } catch (error) {
    if (error.code === 'STOCK_CHANGED') {
      return res.status(error.status || 409).json({ success: false, code: error.code, message: error.message, unavailableItems: error.details || [] });
    }
    if (error.status) return res.status(error.status).json({ success: false, code: error.code, message: error.message, unavailableItems: error.details });
    console.error('[Checkout] create error:', error.message);
    return res.status(502).json({ success: false, message: error.message || 'Unable to start checkout.' });
  }
};

export const verifyRazorpayCheckout = async (req, res) => {
  try {
    const checkoutKey = String(req.body?.checkoutKey || '');
    const orderId = String(req.body?.razorpay_order_id || '');
    const paymentId = String(req.body?.razorpay_payment_id || '');
    const signature = String(req.body?.razorpay_signature || '');
    if (!validateCheckoutKey(checkoutKey) || !orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Razorpay payment confirmation is incomplete.' });
    }
    const SessionModel = getCheckoutSessionModel();
    const session = await SessionModel.findOne({ customer: req.user._id, checkoutKey });
    if (!session || session.paymentMethod !== 'razorpay') return res.status(404).json({ success: false, message: 'Checkout payment attempt was not found.' });
    if (session.status === 'placed') {
      const orders = await orderGroupBySession(session._id);
      return res.json({ success: true, idempotent: true, masterOrderId: session.masterOrderId, orders: await Promise.all(orders.map(formatOrder)), total: session.total });
    }
    if (session.status !== 'pending_payment' || session.razorpayOrderId !== orderId) {
      return res.status(409).json({ success: false, message: 'Payment does not match an active checkout.' });
    }
    if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
      await markSession(session, { status: 'payment_failed', failureReason: 'Payment attempt expired.' });
      return res.status(409).json({ success: false, message: 'This payment attempt expired. Start checkout again.' });
    }
    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ success: false, message: 'Payment signature is invalid.' });
    }

    let payment = await fetchRazorpayPayment(paymentId);
    if (payment.order_id !== orderId || Number(payment.amount) !== Math.round(session.total * 100) || payment.currency !== 'INR') {
      return res.status(400).json({ success: false, message: 'Payment amount or order does not match this checkout.' });
    }
    if (payment.status === 'authorized') {
      await captureRazorpayPayment(paymentId, Number(payment.amount), payment.currency);
      payment = await fetchRazorpayPayment(paymentId);
    }
    if (payment.status !== 'captured') return res.status(409).json({ success: false, message: 'Razorpay has not captured this payment.' });

    const claimed = await getCheckoutSessionModel().findOneAndUpdate(
      { _id: session._id, status: 'pending_payment' },
      { $set: { status: 'processing', razorpayPaymentId: paymentId, razorpaySignatureVerified: true } },
      { new: true }
    );
    if (!claimed) return res.status(409).json({ success: false, message: 'This payment confirmation is already being processed.' });

    try {
      const result = await placeSessionOrders(claimed, { paymentStatus: 'paid', paymentId });
      return res.status(201).json({ success: true, masterOrderId: result.session.masterOrderId, orders: await Promise.all(result.orders.map(formatOrder)), total: result.session.total });
    } catch (error) {
      let refund = null;
      try { refund = await refundRazorpayPayment(paymentId, Math.round(session.total * 100), session.masterOrderId); }
      catch (refundError) { console.error('[Checkout] automatic refund failed:', refundError.message); }
      const status = refund ? 'refunded' : 'refund_pending';
      await markSession(claimed, { status, razorpayPaymentId: paymentId, failureReason: error.message });
      return res.status(409).json({
        success: false,
        paymentCaptured: true,
        refundStatus: status,
        message: refund
          ? 'Stock changed before the paid order could be confirmed. A refund has been initiated.'
          : 'Stock changed before the paid order could be confirmed. The payment could not be refunded automatically; contact support.'
      });
    }
  } catch (error) {
    console.error('[Checkout] payment verification error:', error.message);
    return res.status(502).json({ success: false, message: error.message || 'Unable to verify the Razorpay payment.' });
  }
};

export const getOrders = async (req, res) => {
  try {
    const query = req.user.role === 'customer' ? { customer: req.user._id }
      : req.user.role === 'vendor' ? { vendor: req.user._id }
        : {};
    const OrderModel = getOrderModel();
    let cursor = OrderModel.find(query).sort({ createdAt: -1 }).limit(100);
    if (isMongoConnected()) cursor = cursor.populate('customer', 'name email phone').populate('vendor', 'name email');
    const orders = await cursor;
    res.json({ success: true, count: orders.length, orders: await Promise.all(orders.map(formatOrder)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const scopedOrder = async (req, id) => {
  const OrderModel = getOrderModel();
  if (isMongoConnected() && !mongoose.Types.ObjectId.isValid(id)) return null;
  const scope = req.user.role === 'customer' ? { customer: req.user._id }
    : req.user.role === 'vendor' ? { vendor: req.user._id }
      : {};
  let query = OrderModel.findOne({ _id: id, ...scope });
  if (isMongoConnected()) query = query.populate('customer', 'name email phone').populate('vendor', 'name email');
  return query;
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await scopedOrder(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order: await formatOrder(order) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const lockOrder = async order => getOrderModel().findOneAndUpdate(
  { _id: order._id, status: order.status, transitionLock: { $ne: true } },
  { $set: { transitionLock: true } },
  { new: true }
);

const restoreOrderInventory = async order => {
  if (order.stockRestored) return;
  for (const item of order.items || []) {
    await adjustInventory(idOf(item.product), Number(item.quantity), -Number(item.quantity));
  }
};

const transitionOrder = async ({ req, order, nextStatus, note = '', tracking = {}, actorRole, refundOnCancel = true }) => {
  const OrderModel = getOrderModel();
  if (!statusValues.includes(nextStatus)) throw httpError('Invalid order status.', 400);
  if (order.status === nextStatus) return order;
  const transitions = {
    pending: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    confirmed: ['processing', 'shipped', 'delivered', 'cancelled'],
    processing: ['shipped', 'delivered', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };
  if (!transitions[order.status]?.includes(nextStatus)) throw httpError(`Order cannot move from ${order.status} to ${nextStatus}.`, 409);
  if (nextStatus === 'cancelled' && ['shipped', 'delivered'].includes(order.status)) throw httpError('Shipped or delivered orders cannot be cancelled.', 409);

  const locked = await lockOrder(order);
  if (!locked) throw httpError('This order is being updated. Refresh and try again.', 409);
  let refundId = '';
  try {
    if (nextStatus === 'cancelled' && order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay' && refundOnCancel) {
      const refund = await refundRazorpayPayment(order.razorpayPaymentId, Math.round(Number(order.total) * 100), order.orderNumber);
      refundId = refund.id || '';
    }
    if (nextStatus === 'cancelled' && !order.stockRestored) await restoreOrderInventory(order);

    const set = {
      status: nextStatus,
      transitionLock: false,
      ...(nextStatus === 'cancelled' && !order.stockRestored ? { stockRestored: true } : {}),
      ...(nextStatus === 'cancelled' && order.paymentStatus === 'paid' && order.paymentMethod === 'razorpay'
        ? { paymentStatus: 'refunded', refundStatus: 'refunded', razorpayRefundId: refundId }
        : {}),
      ...(nextStatus === 'shipped' ? { shippedAt: new Date() } : {}),
      ...(nextStatus === 'delivered' ? { deliveredAt: new Date() } : {}),
      ...(nextStatus === 'delivered' && order.paymentMethod === 'cod' ? { paymentStatus: 'paid' } : {}),
      ...(tracking.courier !== undefined ? { courier: String(tracking.courier).trim().slice(0, 100) } : {}),
      ...(tracking.trackingNumber !== undefined ? { trackingNumber: String(tracking.trackingNumber).trim().slice(0, 120) } : {})
    };
    const updated = await OrderModel.findByIdAndUpdate(order._id, {
      $set: set,
      $push: { statusHistory: { status: nextStatus, changedBy: req.user._id, role: actorRole, note: String(note || '').trim().slice(0, 300), at: new Date() } }
    }, { new: true });
    if (updated) {
      const orderText = order.orderNumber || `Order ${idOf(order._id)}`;
      await createUserNotification(order.customer, {
        type: 'order_status',
        title: 'Order status updated',
        message: `${orderText} is now ${nextStatus}.`,
        href: `/orders/${idOf(order._id)}`
      });
      if (actorRole !== 'vendor') await createUserNotification(order.vendor, {
        type: 'order_status',
        title: 'Vendor order status updated',
        message: `${orderText} is now ${nextStatus}.`,
        href: '/vendor/dashboard'
      });
    }
    return updated;
  } catch (error) {
    await OrderModel.findByIdAndUpdate(order._id, { transitionLock: false }, { new: true });
    throw error;
  }
};

export const cancelCustomerOrder = async (req, res) => {
  try {
    const order = await scopedOrder(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status === 'cancelled') return res.json({ success: true, order: await formatOrder(order), idempotent: true });
    if (!['pending', 'confirmed'].includes(order.status)) return res.status(409).json({ success: false, message: 'Only pending or confirmed orders can be cancelled.' });
    const updated = await transitionOrder({ req, order, nextStatus: 'cancelled', actorRole: 'customer', note: 'Cancelled by customer.' });
    res.json({ success: true, order: await formatOrder(updated) });
  } catch (error) {
    res.status(error.status || (error.message.includes('Razorpay') ? 503 : 500)).json({ success: false, message: error.message });
  }
};

export const decideVendorOrder = async (req, res) => {
  try {
    const order = await scopedOrder(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'pending') return res.status(409).json({ success: false, message: 'Only pending orders can be accepted or rejected.' });
    const action = String(req.body?.action || '').toLowerCase();
    if (action === 'accept') {
      const updated = await transitionOrder({ req, order, nextStatus: 'confirmed', actorRole: 'vendor', note: 'Accepted by vendor.' });
      return res.json({ success: true, order: await formatOrder(updated) });
    }
    if (action === 'reject') {
      const updated = await transitionOrder({ req, order, nextStatus: 'cancelled', actorRole: 'vendor', note: String(req.body?.reason || 'Rejected by vendor.'), refundOnCancel: true });
      return res.json({ success: true, order: await formatOrder(updated) });
    }
    return res.status(400).json({ success: false, message: 'Action must be accept or reject.' });
  } catch (error) {
    res.status(error.status || (error.message.includes('Razorpay') ? 503 : 500)).json({ success: false, message: error.message });
  }
};

export const updateVendorShipment = async (req, res) => {
  try {
    const order = await scopedOrder(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const nextStatus = String(req.body?.status || '').toLowerCase();
    if (!['processing', 'shipped', 'delivered'].includes(nextStatus)) return res.status(400).json({ success: false, message: 'Vendor status must be processing, shipped, or delivered.' });
    const validNext = { confirmed: 'processing', processing: 'shipped', shipped: 'delivered' };
    if (validNext[order.status] !== nextStatus) return res.status(409).json({ success: false, message: 'Accept a pending order first, then update it through processing, shipped, and delivered.' });
    const updated = await transitionOrder({
      req,
      order,
      nextStatus,
      actorRole: 'vendor',
      note: req.body?.note || '',
      tracking: { courier: req.body?.courier, trackingNumber: req.body?.trackingNumber }
    });
    res.json({ success: true, order: await formatOrder(updated) });
  } catch (error) {
    res.status(error.status || (error.message.includes('Razorpay') ? 503 : 500)).json({ success: false, message: error.message });
  }
};

export const getAllAdminOrders = async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod } = req.query;
    const query = {};
    if (status && statusValues.includes(status)) query.status = status;
    if (paymentStatus && ['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) query.paymentStatus = paymentStatus;
    if (paymentMethod && ['cod', 'razorpay'].includes(paymentMethod)) query.paymentMethod = paymentMethod;
    const OrderModel = getOrderModel();
    let cursor = OrderModel.find(query).sort({ createdAt: -1 }).limit(250);
    if (isMongoConnected()) cursor = cursor.populate('customer', 'name email phone').populate('vendor', 'name email');
    const orders = await cursor;
    res.json({ success: true, count: orders.length, orders: await Promise.all(orders.map(formatOrder)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminTransactions = async (req, res) => {
  try {
    const OrderModel = getOrderModel();
    let cursor = OrderModel.find({}).sort({ createdAt: -1 }).limit(250);
    if (isMongoConnected()) cursor = cursor.populate('customer', 'name email').populate('vendor', 'name email');
    const orders = await cursor;
    const formattedOrders = await Promise.all(orders.map(formatOrder));
    const orderTransactions = [];
    const razorpayGroups = new Map();
    for (const order of formattedOrders) {
      if (order.paymentMethod === 'razorpay') {
        const key = order.masterOrderId || order.razorpayOrderId || idOf(order._id);
        if (!razorpayGroups.has(key)) razorpayGroups.set(key, []);
        razorpayGroups.get(key).push(order);
        continue;
      }
      orderTransactions.push({
        type: 'order',
        orderId: idOf(order._id),
        orderNumber: order.orderNumber,
        masterOrderId: order.masterOrderId,
        customer: order.customer,
        vendor: order.vendor,
        amount: order.total,
        currency: 'INR',
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        razorpayOrderId: '',
        razorpayPaymentId: '',
        razorpayRefundId: '',
        refundStatus: 'none',
        orderStatus: order.status,
        createdAt: order.createdAt
      });
    }
    for (const [masterOrderId, group] of razorpayGroups) {
      const first = group[0];
      const refundedOrders = group.filter(order => order.paymentStatus === 'refunded');
      const refundedAmount = refundedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
      const statuses = [...new Set(group.map(order => order.status))];
      orderTransactions.push({
        type: 'order',
        orderId: masterOrderId,
        orderNumber: masterOrderId,
        masterOrderId,
        customer: first.customer,
        vendor: group.map(order => order.vendor),
        orderIds: group.map(order => idOf(order._id)),
        orderCount: group.length,
        amount: Number(first.masterTotal || group.reduce((sum, order) => sum + Number(order.total || 0), 0)),
        refundedAmount,
        currency: 'INR',
        paymentMethod: 'razorpay',
        paymentStatus: refundedOrders.length === group.length ? 'refunded' : (refundedOrders.length ? 'partially_refunded' : first.paymentStatus),
        razorpayOrderId: first.razorpayOrderId || '',
        razorpayPaymentId: first.razorpayPaymentId || '',
        razorpayRefundId: refundedOrders.map(order => order.razorpayRefundId).filter(Boolean).join(', '),
        refundStatus: refundedOrders.length === 0 ? 'none' : (refundedOrders.length === group.length ? 'refunded' : 'partially_refunded'),
        orderStatus: statuses.length === 1 ? statuses[0] : 'mixed',
        createdAt: first.createdAt
      });
    }
    const SessionModel = getCheckoutSessionModel();
    const attempts = await SessionModel.find({}).sort({ createdAt: -1 }).limit(250);
    const represented = new Set(orders.map(order => idOf(order.checkoutSession)));
    const checkoutAttempts = attempts
      .filter(attempt => !represented.has(idOf(attempt._id)) && attempt.paymentMethod === 'razorpay')
      .map(attempt => ({
        type: 'checkout_attempt',
        orderId: '',
        orderNumber: '',
        masterOrderId: attempt.masterOrderId,
        amount: attempt.total,
        currency: 'INR',
        paymentMethod: attempt.paymentMethod,
        paymentStatus: attempt.status === 'refunded' ? 'refunded' : (attempt.status === 'payment_failed' ? 'failed' : 'pending'),
        razorpayOrderId: attempt.razorpayOrderId || '',
        razorpayPaymentId: attempt.razorpayPaymentId || '',
        razorpayRefundId: '',
        refundStatus: attempt.status === 'refund_pending' ? 'pending' : attempt.status,
        orderStatus: attempt.status,
        createdAt: attempt.createdAt
      }));
    const transactions = [...orderTransactions, ...checkoutAttempts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const order = await scopedOrder(req, req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const nextStatus = String(req.body?.status || '').toLowerCase();
    const updated = await transitionOrder({
      req,
      order,
      nextStatus,
      actorRole: 'admin',
      note: req.body?.note || 'Updated by administrator.',
      tracking: { courier: req.body?.courier, trackingNumber: req.body?.trackingNumber }
    });
    res.json({ success: true, order: await formatOrder(updated) });
  } catch (error) {
    res.status(error.status || (error.message.includes('Razorpay') ? 503 : 500)).json({ success: false, message: error.message });
  }
};
