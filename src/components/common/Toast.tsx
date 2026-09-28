import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Floating Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-3"
      >
        {toasts.map((t) => {
          const getStyles = () => {
            switch (t.type) {
              case "success":
                return {
                  bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
                  icon: <CheckCircle2 className="w-4 h-4 text-[#37A448] shrink-0" />,
                };
              case "error":
                return {
                  bg: "bg-rose-50 border-rose-200 text-rose-900",
                  icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
                };
              case "warning":
                return {
                  bg: "bg-amber-50 border-amber-200 text-amber-900",
                  icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
                };
              case "info":
              default:
                return {
                  bg: "bg-purple-50 border-purple-200 text-[#902A8B]",
                  icon: <Info className="w-4 h-4 text-[#902A8B] shrink-0" />,
                };
            }
          };

          const s = getStyles();

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 fade-in duration-200 ${s.bg}`}
            >
              <div className="pt-0.5">{s.icon}</div>
              <div className="flex-1 text-xs font-medium font-kalpurush leading-snug">
                {t.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition cursor-pointer shrink-0"
                aria-label="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Graceful fallback if invoked outside provider
    return {
      showToast: (msg: string) => console.info("[Toast fallback]:", msg),
      removeToast: () => {},
    };
  }
  return ctx;
}
