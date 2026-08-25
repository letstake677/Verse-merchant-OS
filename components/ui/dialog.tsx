import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  className,
}: DialogProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Centering Wrapper that scrolls safely on mobile devices */}
          <div className="flex min-h-full items-center justify-center py-2 sm:py-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "relative w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl z-10 my-auto",
                maxWidthClasses[maxWidth],
                className
              )}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer z-20"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header */}
              {(title || description) && (
                <div className="mb-3.5 sm:mb-4 pr-7 space-y-0.5 sm:space-y-1">
                  {title && (
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="text-sm text-slate-700">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="mt-4 sm:mt-6 flex items-center justify-end gap-2.5 pt-3 sm:pt-4 border-t border-slate-100">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
