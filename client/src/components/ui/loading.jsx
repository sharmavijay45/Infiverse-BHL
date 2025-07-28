import { cn } from "@/lib/utils"

export function LoadingSpinner({ className, size = "default", ...props }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}

export function LoadingDots({ className, ...props }) {
  return (
    <div className={cn("flex space-x-1", className)} {...props}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
    </div>
  )
}

export function LoadingPulse({ className, ...props }) {
  return (
    <div className={cn("flex space-x-2", className)} {...props}>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
      <div className="w-3 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
    </div>
  )
}

export function LoadingCard({ className, ...props }) {
  return (
    <div className={cn("animate-pulse", className)} {...props}>
      <div className="bg-muted rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-muted rounded-lg h-4 w-1/2 mb-2"></div>
      <div className="bg-muted rounded-lg h-4 w-5/6"></div>
    </div>
  )
}

export function LoadingPage({ className, ...props }) {
  return (
    <div className={cn("space-y-6 animate-fade-in", className)} {...props}>
      <div className="space-y-2">
        <div className="bg-muted rounded-lg h-8 w-1/3 animate-pulse"></div>
        <div className="bg-muted rounded-lg h-4 w-1/2 animate-pulse"></div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted rounded-xl h-32 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="bg-muted rounded-lg h-6 w-3/4 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
            <div className="bg-muted rounded-xl h-48 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
          </div>
        ))}
      </div>
    </div>
  )
}
