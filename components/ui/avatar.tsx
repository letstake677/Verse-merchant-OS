import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback: string
  size?: "sm" | "default" | "lg"
}

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "default",
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    default: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm font-medium",
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 items-center justify-center font-medium text-slate-700 select-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span className="uppercase">{fallback.slice(0, 2)}</span>
      )}
    </div>
  )
}
