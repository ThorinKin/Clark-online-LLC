// Login_react/src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { products } from '@/data/products';

const STORAGE_KEY = 'ttxs-cart';

const productLookup = products.reduce((acc, product) => {
    acc[product.id] = product;
    return acc;
}, {});

const rehydrateCartItems = (items) => {
    if (!Array.isArray(items)) return [];

    return items
        .map(item => {
            const baseProduct = productLookup[item?.id];
            if (!baseProduct) return null;

            const quantity = Number.isFinite(item?.quantity) && item.quantity > 0 ? item.quantity : 1;

            return {
                ...baseProduct,
                quantity,
            };
        })
        .filter(Boolean);
};

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const serializedCart = useMemo(
        () => JSON.stringify(cartItems.map(item => ({ ...item, quantity: item.quantity }))),
        [cartItems]
    );

    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(STORAGE_KEY);
            if (!savedCart) return;

            const parsed = JSON.parse(savedCart);
            const hydrated = rehydrateCartItems(parsed);
            setCartItems(hydrated);
        } catch (error) {
            console.warn('Failed to load cart from storage', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, serializedCart);
    }, [serializedCart]);

    const addToCart = (product) => {
        const baseProduct = productLookup[product?.id];
        if (!baseProduct) {
            console.warn('Attempted to add unknown product to cart', product);
            return;
        }
    setCartItems(prev => {
        const existingItem = prev.find(item => item.id === product.id);
        if (existingItem) {
        return prev.map(item =>
            item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        }
        return [...prev, { ...baseProduct, quantity: 1 }];
    });
    };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};