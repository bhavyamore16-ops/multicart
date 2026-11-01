import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'multicart_cart';

const readGuestCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(item => item?.id && !String(item.id).startsWith('prod-') && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0) : [];
  } catch {
    return [];
  }
};

const showCartItem = (item) => ({
  ...item,
  id: String(item.productId || item.id || item._id || ''),
  quantity: Number(item.quantity || 1),
  price: Number(item.price || 0),
  stock: Number(item.stock || 0),
  image: item.image || item.thumbnail || ''
});

const fromServerCart = (response) => (response?.items || []).map(showCartItem);

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const isServerCustomer = user?.role === 'customer' && Boolean(token) && !token.startsWith('mock_');
  const accountId = isServerCustomer ? user._id : null;
  const [cartItems, setCartItems] = useState(readGuestCart);
  const [notification, setNotification] = useState(null);
  const [cartError, setCartError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const notificationTimer = useRef(null);

  const showNotification = (message) => {
    setNotification(message);
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    notificationTimer.current = setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    if (!accountId) {
      setCartItems(readGuestCart());
      setCartError('');
      return () => { cancelled = true; };
    }

    const guestItems = readGuestCart();
    setCartItems([]);
    setCartError('');
    setIsSyncing(true);
    cartAPI.merge(guestItems.map(item => ({ productId: item.id, quantity: item.quantity })))
      .then(response => {
        if (cancelled) return;
        setCartItems(fromServerCart(response));
        localStorage.removeItem(STORAGE_KEY);
        if (response.rejected?.length) showNotification('Some guest cart items were unavailable and were not added.');
      })
      .catch(error => {
        if (cancelled) return;
        setCartError(error.message || 'Unable to load your saved cart.');
        showNotification('Unable to sync your cart. Please retry.');
      })
      .finally(() => { if (!cancelled) setIsSyncing(false); });
    return () => { cancelled = true; };
  }, [accountId, token]);

  useEffect(() => {
    if (!isServerCustomer) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems)); }
      catch (error) { console.error('Failed to persist guest cart', error); }
    }
  }, [cartItems, isServerCustomer]);

  const applyServerResponse = (response) => {
    setCartItems(fromServerCart(response));
    setCartError('');
  };

  const addToCart = async (product, quantity = 1) => {
    const productId = String(product?._id || product?.id || '');
    const amount = Number(quantity);
    if (!productId || !Number.isInteger(amount) || amount < 1) {
      showNotification('Choose a valid product quantity.');
      return false;
    }
    const existing = cartItems.find(item => item.id === productId);
    const desired = (existing?.quantity || 0) + amount;
    const stock = Number(product.stock ?? existing?.stock ?? 0);
    if (product.isAvailable === false || product.isPurchasable === false || stock < 1) {
      showNotification('This product is currently unavailable.');
      return false;
    }
    if (desired > stock) {
      showNotification(`Only ${stock} unit(s) are currently available.`);
      return false;
    }

    if (isServerCustomer) {
      try {
        const response = await cartAPI.add(productId, amount);
        applyServerResponse(response);
        showNotification(`Added ${product.name} to your saved cart.`);
        return true;
      } catch (error) {
        showNotification(error.message || 'Unable to add this product to your cart.');
        return false;
      }
    }

    setCartItems(previous => {
      const current = previous.find(item => item.id === productId);
      if (current) return previous.map(item => item.id === productId ? { ...item, quantity: desired, stock } : item);
      return [...previous, showCartItem({
        id: productId,
        name: product.name,
        slug: product.slug || productId,
        price: product.price,
        originalPrice: product.originalPrice,
        vendorId: product.vendorId,
        vendorName: product.vendorName,
        image: product.image || product.thumbnail,
        quantity: amount,
        stock,
        isAvailable: true
      })];
    });
    showNotification(`Added ${product.name} to your cart.`);
    return true;
  };

  const updateQuantity = async (productId, newQuantity) => {
    const quantity = Number(newQuantity);
    if (!Number.isInteger(quantity) || quantity < 0) return false;
    if (quantity === 0) return removeFromCart(productId);
    const item = cartItems.find(entry => entry.id === productId);
    if (!item) return false;
    if (quantity > item.stock) {
      showNotification(`Only ${item.stock} unit(s) are currently available.`);
      return false;
    }
    if (isServerCustomer) {
      try {
        const response = await cartAPI.update(productId, quantity);
        applyServerResponse(response);
        return true;
      } catch (error) {
        showNotification(error.message || 'Unable to update this quantity.');
        return false;
      }
    }
    setCartItems(previous => previous.map(entry => entry.id === productId ? { ...entry, quantity } : entry));
    return true;
  };

  const removeFromCart = async (productId) => {
    if (isServerCustomer) {
      try {
        const response = await cartAPI.remove(productId);
        applyServerResponse(response);
      } catch (error) {
        showNotification(error.message || 'Unable to remove this product.');
        return false;
      }
    } else {
      setCartItems(previous => previous.filter(item => item.id !== productId));
    }
    showNotification('Item removed from cart.');
    return true;
  };

  const clearCart = async () => {
    if (isServerCustomer) {
      try {
        const response = await cartAPI.clear();
        applyServerResponse(response);
      } catch (error) {
        showNotification(error.message || 'Unable to clear your saved cart.');
        return false;
      }
    } else {
      setCartItems([]);
    }
    return true;
  };

  const validateCart = async () => {
    if (!isServerCustomer) {
      const invalidItems = cartItems.filter(item => item.isAvailable === false || item.stock < item.quantity || item.stock < 1);
      return { success: invalidItems.length === 0, unavailableItems: invalidItems };
    }
    try {
      const response = await cartAPI.validate();
      applyServerResponse(response);
      return response;
    } catch (error) {
      if (error.data?.items) applyServerResponse(error.data);
      throw error;
    }
  };

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalOriginal = cartItems.reduce((sum, item) => sum + (Number(item.originalPrice || item.price) * item.quantity), 0);
  const totalDiscount = totalOriginal - subtotal;
  const shippingFee = subtotal > 1999 || subtotal === 0 ? 0 : 150;
  const grandTotal = subtotal + shippingFee;
  const itemsByVendor = useMemo(() => {
    const groups = cartItems.reduce((acc, item) => {
      const vendorId = item.vendorId || 'vendor-unassigned';
      if (!acc[vendorId]) acc[vendorId] = { vendorId, vendorName: item.vendorName || 'MultiCart Seller', items: [], subtotal: 0 };
      acc[vendorId].items.push(item);
      acc[vendorId].subtotal += item.price * item.quantity;
      return acc;
    }, {});
    return Object.values(groups);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart, clearCart, validateCart,
      totalItemsCount, subtotal, totalOriginal, totalDiscount, shippingFee, grandTotal,
      itemsByVendor, notification, cartError, isSyncing, isServerCustomer
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
