"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AiSidebarStateContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AiSidebarStateContext = createContext<AiSidebarStateContextValue | null>(null);

/**
 * Provides AI sidebar open/close state to both the navbar trigger
 * and the sidebar component itself, regardless of where they sit
 * in the component tree.
 */
export function AiSidebarStateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <AiSidebarStateContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </AiSidebarStateContext.Provider>
  );
}

export function useAiSidebarState() {
  const ctx = useContext(AiSidebarStateContext);
  if (!ctx) {
    throw new Error("useAiSidebarState must be used inside AiSidebarStateProvider");
  }
  return ctx;
}
