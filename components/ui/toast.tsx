 "use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "error" | "warning";

interface ToastState {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastState, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((value: Omit<ToastState, "id">) => {
    const id = Date.now();
    setToast({
      id,
      ...value,
    });
    setTimeout(() => {
      setToast((current) => {
        if (!current) return null;
        return current.id === id ? null : current;
      });
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-y-0 right-0 flex items-start justify-end pointer-events-none pr-4 pt-4">
        {toast && (
          <div
            className={`pointer-events-auto w-80 rounded-md shadow-lg border px-4 py-3 space-y-1 translate-x-0 transition-transform text-white
            ${
              toast.variant === "success"
                ? "bg-success border-successBorder"
                : toast.variant === "error"
                ? "bg-error border-errorBorder"
                : "bg-warning border-warningBorder"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold" style={{ color: "#ffffff" }}>
                {toast.title}
              </p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs uppercase tracking-wide opacity-70 hover:opacity-100"
                style={{ color: "#ffffff" }}
              >
                Close
              </button>
            </div>
            {toast.description != null && toast.description !== "" && (
              <p className="text-sm opacity-90" style={{ color: "#ffffff" }}>
                {typeof toast.description === "string"
                  ? toast.description
                  : JSON.stringify(toast.description)}
              </p>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

