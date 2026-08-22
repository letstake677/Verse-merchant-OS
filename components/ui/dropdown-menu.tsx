import * as React from "react"
import { cn } from "@/lib/utils"

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  separatorAfter?: boolean
}

export interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-52 origin-top-right rounded-xl border border-slate-200 bg-white p-1 text-slate-950 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in-0 zoom-in-95 duration-100",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <button
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.()
                    setIsOpen(false)
                  }
                }}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50",
                  item.destructive
                    ? "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.icon && <span className="h-4 w-4 shrink-0 text-slate-500">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
              </button>
              {item.separatorAfter && <div className="my-1 h-[1px] bg-slate-100" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
