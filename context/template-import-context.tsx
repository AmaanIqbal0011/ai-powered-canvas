"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

/**
 * Function signature for importing a template into the canvas.
 */
type ImportTemplateFn = (template: CanvasTemplate) => void;

/**
 * Context value exposed to both the canvas (to register the handler)
 * and the modal (to trigger the import).
 */
interface TemplateImportContextValue {
  /** Callable import function. Null until the canvas mounts and registers it. */
  importTemplate: ImportTemplateFn | null;
  /** Called by the canvas to register its import handler. */
  registerHandler: (fn: ImportTemplateFn) => void;
}

const TemplateImportCtx = createContext<TemplateImportContextValue>({
  importTemplate: null,
  registerHandler: () => {},
});

/**
 * Provider that bridges the canvas's import handler to the starter templates
 * modal. The canvas calls `registerHandler` once it mounts, and the modal
 * calls `importTemplate` when the user picks a template.
 */
export function TemplateImportProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [importTemplate, setImportTemplate] =
    useState<ImportTemplateFn | null>(null);

  const registerHandler = useCallback((fn: ImportTemplateFn) => {
    setImportTemplate(() => fn);
  }, []);

  return (
    <TemplateImportCtx.Provider value={{ importTemplate, registerHandler }}>
      {children}
    </TemplateImportCtx.Provider>
  );
}

/**
 * Access the template import context.
 */
export function useTemplateImport() {
  return useContext(TemplateImportCtx);
}
