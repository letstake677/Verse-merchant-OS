import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  side?: "left" | "right" | "bottom"
  className?: string
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: DrawerProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const motionVariants = {
    right: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
      classes: "inset-y-0 right-0 h-full w-full max-w-md border-l border-slate-200",
    },
    left: {
      initial: { x: "-100%" },
      animate: { x: 0 },
      exit: { x: "-100%" },
      classes: "inset-y-0 left-0 h-full w-full max-w-md border-r border-slate-200",
    },
    bottom: {
      initial: { y: "100%" },
      animate: { y: 0 },
      exit: { y: "100%" },
      classes: "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-2xl border-t border-slate-200",
    },
  }

  const selectedSide = motionVariants[side]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={selectedSide.initial}
            animate={selectedSide.animate}
            exit={selectedSide.exit}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "fixed bg-white shadow-2xl z-10 flex flex-col p-6",
              selectedSide.classes,
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1 pr-4">
                {title && (
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-slate-500 font-normal leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto py-4 text-sm text-slate-700">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
