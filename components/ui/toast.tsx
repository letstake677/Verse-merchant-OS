"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  title: string
  description?: string
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  toast: (toast: Omit<ToastItem, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback(
    ({ title, description, type = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, title, description, type, duration }

      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, duration)
      }
    },
    []
  )

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end p-4 sm:p-6 gap-2 print:hidden"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const icons = {
              success: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
              error: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
              warning: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
              info: <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />,
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-auto w-full max-w-sm rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-lg",
                  "flex items-start gap-3 select-none"
                )}
              >
                {icons[t.type || "info"]}
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                  aria-label="Dismiss toast"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast: () => {},
      dismiss: () => {},
    }
  }
  return context
}
