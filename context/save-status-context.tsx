"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/**
 * Save status for the canvas autosave feature.
 *
 * - idle: no save has been attempted yet
 * - saving: a save is in flight (debounce timer running or request pending)
 * - saved: the last save completed successfully
 * - error: the last save failed
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Context value available to both the canvas (to update status)
 * and the navbar (to display status).
 */
interface SaveStatusContextValue {
  status: SaveStatus;
  error: string | null;
  updateStatus: (status: SaveStatus, error?: string | null) => void;
  /** Register a handler for manual save triggers from the navbar. */
  registerSaveHandler: (handler: () => void) => void;
  /** Trigger a manual save via the registered handler. */
  triggerSave: () => void;
}

const NOOP = () => {};

const SaveStatusCtx = createContext<SaveStatusContextValue>({
  status: "idle",
  error: null,
  updateStatus: NOOP,
  registerSaveHandler: NOOP,
  triggerSave: NOOP,
});

/**
 * Provider that tracks canvas save state.
 * Wrap around the entire workspace layout so both the navbar
 * and the canvas can read/write the save status.
 */
export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const saveHandlerRef = useRef<(() => void) | null>(null);

  const updateStatus = useCallback(
    (newStatus: SaveStatus, newError?: string | null) => {
      setStatus(newStatus);
      if (newError !== undefined) {
        setError(newError);
      }
    },
    [],
  );

  const registerSaveHandler = useCallback((handler: () => void) => {
    saveHandlerRef.current = handler;
  }, []);

  const triggerSave = useCallback(() => {
    saveHandlerRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ status, error, updateStatus, registerSaveHandler, triggerSave }),
    [status, error, updateStatus, registerSaveHandler, triggerSave],
  );

  return (
    <SaveStatusCtx.Provider value={value}>{children}</SaveStatusCtx.Provider>
  );
}

/**
 * Read the current save status and update function.
 */
export function useSaveStatus() {
  return useContext(SaveStatusCtx);
}
