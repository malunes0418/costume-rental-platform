"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface CartContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return (
    <CartContext.Provider value={{ isCartOpen, openCart, closeCart, refreshKey, triggerRefresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
