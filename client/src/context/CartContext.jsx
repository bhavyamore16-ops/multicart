import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('multicart_cart');
      return saved ? JSON.parse(saved) : [
        // Pre-populate with 2 sample items from different vendors to showcase multi-vendor cart!
        {
          id: "prod-1",
          name: "Aura Pro Wireless ANC Headphones",
          slug: "aura-pro-wireless-headphones",
          price: 4999,
          originalPrice: 7999,
          vendorId: "vnd-1",
          vendorName: "Apex Electronics",
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
          quantity: 1,
          stock: 24
        },
        {
          id: "prod-4",
          name: "Artisan Pour-Over Ceramic Coffee Set",
          slug: "artisan-ceramic-coffee-set",
          price: 1499,
          originalPrice: 2299,
          vendorId: "vnd-3",
          vendorName: "Casa Craft Home",
          image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
          quantity: 2,
          stock: 12
        }
      ];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('multicart_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to persist cart", e);
    }
  }, [cartItems]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        showNotification(`Updated "${product.name}" quantity in cart!`);
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock || 99) }
            : item
        );
      } else {
        showNotification(`Added "${product.name}" to cart!`);
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            originalPrice: product.originalPrice,
            vendorId: product.vendorId,
            vendorName: product.vendorName,
            image: product.image,
            quantity: quantity,
            stock: product.stock
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    showNotification("Item removed from cart");
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalOriginal = cartItems.reduce((acc, item) => acc + ((item.originalPrice || item.price) * item.quantity), 0);
  const totalDiscount = totalOriginal - subtotal;
  const shippingFee = subtotal > 1999 || subtotal === 0 ? 0 : 150;
  const grandTotal = subtotal + shippingFee;

  // Multi-vendor grouped structure
  const itemsByVendor = cartItems.reduce((acc, item) => {
    const vId = item.vendorId || 'vnd-default';
    if (!acc[vId]) {
      acc[vId] = {
        vendorId: vId,
        vendorName: item.vendorName || 'Independent Vendor',
        items: [],
        subtotal: 0
      };
    }
    acc[vId].items.push(item);
    acc[vId].subtotal += item.price * item.quantity;
    return acc;
  }, {});

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItemsCount,
      subtotal,
      totalOriginal,
      totalDiscount,
      shippingFee,
      grandTotal,
      itemsByVendor: Object.values(itemsByVendor),
      notification
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
