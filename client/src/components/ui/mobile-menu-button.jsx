import { cn } from "../../lib/utils"

export function MobileMenuButton({ isOpen, onClick, className, ...props }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "relative w-12 h-12 rounded-2xl neo-button hover:glow-primary transition-cyber focus:outline-none focus:ring-2 focus:ring-primary/50 overflow-hidden group",
        className
      )}
      aria-label={isOpen ? "Close cyber menu" : "Open cyber menu"}
      {...props}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-5 relative">
          {/* Top line */}
          <span
            className={cn(
              "absolute left-0 top-0 w-full h-0.5 bg-primary rounded-full transition-cyber glow-primary",
              isOpen ? "rotate-45 translate-y-2" : "rotate-0 translate-y-0"
            )}
          />
          {/* Middle line */}
          <span
            className={cn(
              "absolute left-0 top-2 w-full h-0.5 bg-primary rounded-full transition-cyber glow-primary",
              isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"
            )}
          />
          {/* Bottom line */}
          <span
            className={cn(
              "absolute left-0 top-4 w-full h-0.5 bg-primary rounded-full transition-cyber glow-primary",
              isOpen ? "-rotate-45 -translate-y-2" : "rotate-0 translate-y-0"
            )}
          />
        </div>
      </div>

      {/* Cyber grid background */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 group-hover:opacity-20 transition-cyber"></div>
    </button>
  )
}
