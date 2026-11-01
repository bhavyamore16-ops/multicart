import mongoose from 'mongoose';
import {
  getCartModel,
  getProductModel,
  getWishlistModel
} from '../models/dataAccess.js';
import { idOf, isProductFromApprovedVendor, presentProduct } from '../utils/productPresentation.js';

const isMongoConnected = () => mongoose.connection?.readyState === 1;
const cartItemProductId = (item) => idOf(item.product);
const validProductId = (id) => Boolean(id && (!isMongoConnected() || mongoose.Types.ObjectId.isValid(id)));

const getCart = async (customerId, create = true) => {
  const CartModel = getCartModel();
  let cart = await CartModel.findOne({ customer: customerId });
  if (!cart && create) cart = await CartModel.create({ customer: customerId, items: [] });
  return cart;
};

const saveCartItems = async (cart, items) => {
  cart.items.splice(0, cart.items.length);
  items.forEach(item => cart.items.push({ product: item.product, quantity: item.quantity }));
  await cart.save();
};

const presentCart = async (cart) => {
  if (!cart) return { items: [], subtotal: 0, shippingFee: 0, total: 0, totalItems: 0 };
  const ProductModel = getProductModel();
  const returnedItems = [];
  const retainedItems = [];
  for (const item of cart.items || []) {
    const productId = cartItemProductId(item);
    const product = productId && await ProductModel.findById(productId);
    if (!product) continue;
    retainedItems.push({ product: productId, quantity: Number(item.quantity) });
    const presented = await presentProduct(product);
    const quantity = Number(item.quantity);
    const price = presented.discountedPrice;
    const isPurchasable = await isProductFromApprovedVendor(product) &&
      presented.availableToPurchase && Number.isInteger(quantity) && quantity > 0 && quantity <= Number(product.stock);
    returnedItems.push({
      id: presented._id,
      productId: presented._id,
      name: presented.name,
      slug: presented.slug,
      image: presented.thumbnail || presented.images?.[0] || '',
      price,
      originalPrice: presented.discountPercent > 0 ? presented.price : null,
      discountPercent: presented.discountPercent,
      vendorId: presented.vendor?._id || idOf(product.vendor),
      vendorName: presented.vendorProfile?.storeName || presented.vendor?.name || 'MultiCart Seller',
      quantity,
      stock: Number(product.stock || 0),
      isAvailable: isPurchasable,
      categoryName: presented.category?.name || ''
    });
  }
  if (retainedItems.length !== (cart.items || []).length) await saveCartItems(cart, retainedItems);
  const subtotal = returnedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 1999 || subtotal === 0 ? 0 : 150;
  return {
    items: returnedItems,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    totalItems: returnedItems.reduce((sum, item) => sum + item.quantity, 0)
  };
};

const productForPurchase = async (productId) => {
  if (!validProductId(productId)) return { error: 'Product id is invalid.', status: 400 };
  const product = await getProductModel().findById(productId);
  if (!product || !await isProductFromApprovedVendor(product)) return { error: 'Product is not available in the marketplace.', status: 404 };
  if (product.isAvailable === false || Number(product.stock) < 1) {
    return { error: 'This product is currently unavailable.', status: 409, product };
  }
  return { product };
};

const sendCart = async (res, cart, extra = {}) => {
  const result = await presentCart(cart);
  res.json({ success: true, ...result, ...extra });
};

export const getCustomerCart = async (req, res) => {
  try {
    const cart = await getCart(req.user._id, false);
    return sendCart(res, cart);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addCartItem = async (req, res) => {
  try {
    const productId = String(req.body?.productId || '').trim();
    const quantity = Number(req.body?.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number.' });
    }
    const found = await productForPurchase(productId);
    if (found.error) return res.status(found.status).json({ success: false, message: found.error });

    const cart = await getCart(req.user._id);
    const items = [...cart.items].map(item => ({ product: cartItemProductId(item), quantity: Number(item.quantity) }));
    const existing = items.find(item => item.product === productId);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > Number(found.product.stock)) {
      return res.status(409).json({ success: false, message: `Only ${found.product.stock} unit(s) are currently available.` });
    }
    if (existing) existing.quantity = nextQuantity;
    else items.push({ product: productId, quantity });
    await saveCartItems(cart, items);
    return sendCart(res, cart);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const productId = String(req.params.productId || '');
    const quantity = Number(req.body?.quantity);
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Product id is invalid.' });
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a whole number of 0 or more.' });
    }
    const cart = await getCart(req.user._id, false);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    const items = [...cart.items].map(item => ({ product: cartItemProductId(item), quantity: Number(item.quantity) }));
    const item = items.find(entry => entry.product === productId);
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    if (quantity === 0) {
      await saveCartItems(cart, items.filter(entry => entry.product !== productId));
      return sendCart(res, cart);
    }

    const product = await getProductModel().findById(productId);
    const wasIncreasing = quantity > item.quantity;
    if (!product || quantity > Number(product.stock) ||
        (wasIncreasing && (product.isAvailable === false || !await isProductFromApprovedVendor(product)))) {
      return res.status(409).json({ success: false, message: product ? `Only ${product.stock} unit(s) are currently available.` : 'Product is no longer available.' });
    }
    item.quantity = quantity;
    await saveCartItems(cart, items);
    return sendCart(res, cart);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const productId = String(req.params.productId || '');
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Product id is invalid.' });
    const cart = await getCart(req.user._id, false);
    if (!cart) return sendCart(res, null);
    const items = [...cart.items].map(item => ({ product: cartItemProductId(item), quantity: Number(item.quantity) }));
    await saveCartItems(cart, items.filter(item => item.product !== productId));
    return sendCart(res, cart);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCustomerCart = async (req, res) => {
  try {
    const cart = await getCart(req.user._id);
    await saveCartItems(cart, []);
    return sendCart(res, cart);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const mergeGuestCart = async (req, res) => {
  try {
    if (!Array.isArray(req.body?.items) || req.body.items.length > 100) {
      return res.status(400).json({ success: false, message: 'Cart merge items must be an array of up to 100 entries.' });
    }
    const cart = await getCart(req.user._id);
    const items = [...cart.items].map(item => ({ product: cartItemProductId(item), quantity: Number(item.quantity) }));
    const rejected = [];
    for (const requested of req.body.items) {
      const productId = String(requested?.productId || '');
      const quantity = Number(requested?.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        rejected.push({ productId, message: 'Quantity must be a positive whole number.' });
        continue;
      }
      const found = await productForPurchase(productId);
      if (found.error) {
        rejected.push({ productId, message: found.error });
        continue;
      }
      const current = items.find(item => item.product === productId);
      const combined = (current?.quantity || 0) + quantity;
      if (combined > Number(found.product.stock)) {
        rejected.push({ productId, message: `Only ${found.product.stock} unit(s) are currently available.` });
        continue;
      }
      if (current) current.quantity = combined;
      else items.push({ product: productId, quantity });
    }
    await saveCartItems(cart, items);
    return sendCart(res, cart, { rejected });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCustomerCart = async (req, res) => {
  try {
    const cart = await getCart(req.user._id, false);
    const result = await presentCart(cart);
    const unavailableItems = result.items
      .filter(item => !item.isAvailable)
      .map(item => ({ productId: item.productId, name: item.name, message: item.stock < 1 ? 'Out of stock.' : 'Product availability or vendor approval changed.' }));
    if (unavailableItems.length) {
      return res.status(409).json({ success: false, message: 'Some cart items are no longer available.', unavailableItems, ...result });
    }
    res.json({ success: true, message: 'All cart items are available.', ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWishlist = async (customerId, create = false) => {
  const WishlistModel = getWishlistModel();
  let wishlist = await WishlistModel.findOne({ customer: customerId });
  if (!wishlist && create) wishlist = await WishlistModel.create({ customer: customerId, products: [] });
  return wishlist;
};

const presentWishlist = async (wishlist) => {
  if (!wishlist) return [];
  const ProductModel = getProductModel();
  const products = [];
  for (const productRef of wishlist.products || []) {
    const product = await ProductModel.findById(idOf(productRef));
    if (product && await isProductFromApprovedVendor(product)) products.push(await presentProduct(product));
  }
  return products;
};

export const getCustomerWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlist(req.user._id);
    res.json({ success: true, products: await presentWishlist(wishlist) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addWishlistProduct = async (req, res) => {
  try {
    const productId = String(req.body?.productId || '').trim();
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Product id is invalid.' });
    const product = await getProductModel().findById(productId);
    if (!product || !await isProductFromApprovedVendor(product)) {
      return res.status(404).json({ success: false, message: 'Product is not available in the marketplace.' });
    }
    const wishlist = await getWishlist(req.user._id, true);
    const ids = (wishlist.products || []).map(idOf);
    if (!ids.includes(productId)) wishlist.products.push(productId);
    await wishlist.save();
    res.json({ success: true, products: await presentWishlist(wishlist) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeWishlistProduct = async (req, res) => {
  try {
    const productId = String(req.params.productId || '');
    if (!validProductId(productId)) return res.status(400).json({ success: false, message: 'Product id is invalid.' });
    const wishlist = await getWishlist(req.user._id, false);
    if (wishlist) {
      wishlist.products.splice(0, wishlist.products.length, ...wishlist.products.filter(item => idOf(item) !== productId));
      await wishlist.save();
    }
    res.json({ success: true, products: await presentWishlist(wishlist) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
