import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import type { Toast, ToastKind } from "../types";

interface ToastContextValue {
  show: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (m) => show("success", m),
      error: (m) => show("error", m),
      info: (m) => show("info", m),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const config = {
    success: { Icon: CheckCircle2, color: "text-success", bg: "bg-primary-50", border: "border-primary-200" },
    error: { Icon: AlertCircle, color: "text-danger", bg: "bg-red-50", border: "border-red-200" },
    info: { Icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  }[toast.kind];

  return (
    <div
      className={`pointer-events-auto flex animate-slide-in items-start gap-3 rounded-lg border ${config.border} ${config.bg} p-3.5 shadow-card`}
    >
      <config.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
      <p className="flex-1 text-sm font-medium text-ink">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-ink-muted transition hover:text-ink"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
