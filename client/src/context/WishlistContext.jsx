import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { normalizeProduct } from '../utils/product';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'multicart_wishlist';

const readGuestWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(product => product?.id || product?._id).map(product => (
      product.originalPrice !== undefined
        ? { ...product, id: String(product._id || product.id) }
        : normalizeProduct(product)
    )) : [];
  } catch {
    return [];
  }
};

const fromResponse = (response) => (response?.products || []).map(normalizeProduct);

export const WishlistProvider = ({ children }) => {
  const { user, token } = useAuth();
  const isServerCustomer = user?.role === 'customer' && Boolean(token) && !token.startsWith('mock_');
  const accountId = isServerCustomer ? user._id : null;
  const [products, setProducts] = useState(readGuestWishlist);
  const [wishlistError, setWishlistError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!accountId) {
      setProducts(readGuestWishlist());
      setWishlistError('');
      setIsLoading(false);
      return () => { cancelled = true; };
    }
    const guests = readGuestWishlist();
    setProducts([]);
    setWishlistError('');
    setIsLoading(true);
    const sync = async () => {
      try {
        let response = await wishlistAPI.get();
        for (const product of guests) response = await wishlistAPI.add(product.id);
        if (cancelled) return;
        setProducts(fromResponse(response));
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        if (!cancelled) setWishlistError(error.message || 'Unable to load your wishlist.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    sync();
    return () => { cancelled = true; };
  }, [accountId, token]);

  useEffect(() => {
    if (!isServerCustomer) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
      catch (error) { console.error('Failed to persist guest wishlist', error); }
    }
  }, [products, isServerCustomer]);

  const addToWishlist = async (product) => {
    const id = String(product?._id || product?.id || '');
    if (!id) return false;
    if (isServerCustomer) {
      try {
        const response = await wishlistAPI.add(id);
        setProducts(fromResponse(response));
        setWishlistError('');
        return true;
      } catch (error) {
        setWishlistError(error.message || 'Unable to save this product.');
        return false;
      }
    }
    setProducts(previous => previous.some(item => item.id === id) ? previous : [...previous, normalizeProduct(product)]);
    return true;
  };

  const removeFromWishlist = async (productId) => {
    if (isServerCustomer) {
      try {
        const response = await wishlistAPI.remove(productId);
        setProducts(fromResponse(response));
        setWishlistError('');
        return true;
      } catch (error) {
        setWishlistError(error.message || 'Unable to remove this product.');
        return false;
      }
    }
    setProducts(previous => previous.filter(item => item.id !== productId));
    return true;
  };

  const toggleWishlist = (product) => products.some(item => item.id === String(product?._id || product?.id))
    ? removeFromWishlist(String(product?._id || product?.id))
    : addToWishlist(product);
  const isWishlisted = (productId) => products.some(item => item.id === String(productId));

  const value = useMemo(() => ({
    wishlistItems: products,
    wishlistError,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isWishlisted
  }), [products, wishlistError, isLoading, isServerCustomer]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
