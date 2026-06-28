"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type CartOpenOptions = {
  vendorId?: number;
  reservationIds?: number[];
  step?: "CART" | "UPLOAD";
};

interface CartContextType {
  isCartOpen: boolean;
  cartOpenOptions: CartOpenOptions | null;
  openCart: (options?: CartOpenOptions) => void;
  closeCart: () => void;
  clearCartOpenOptions: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartOpenOptions, setCartOpenOptions] = useState<CartOpenOptions | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCart = useCallback((options?: CartOpenOptions) => {
    setCartOpenOptions(options ?? null);
    setIsCartOpen(true);
  }, []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const clearCartOpenOptions = useCallback(() => setCartOpenOptions(null), []);
  const triggerRefresh = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  return (
    <CartContext.Provider
      value={{ isCartOpen, cartOpenOptions, openCart, closeCart, clearCartOpenOptions, refreshKey, triggerRefresh }}
    >
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
