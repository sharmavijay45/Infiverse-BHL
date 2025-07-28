import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "./theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden group hover-cyber neo-button"
        >
          <div className="relative z-10 transition-cyber group-hover:scale-110">
            {theme === "dark" ? (
              <Moon className="h-5 w-5 text-primary glow-primary" />
            ) : theme === "light" ? (
              <Sun className="h-5 w-5 text-accent glow-accent" />
            ) : (
              <Monitor className="h-5 w-5 text-primary glow-cyber" />
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 neo-card border-0 p-3 animate-scale-in"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="rounded-xl transition-cyber hover:neo-inset cursor-pointer p-3 mb-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-accent rounded-lg glow-accent">
              <Sun className="h-4 w-4 text-accent-foreground" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Light Mode</div>
              <div className="text-xs text-muted-foreground">Bright cyber interface</div>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="rounded-xl transition-cyber hover:neo-inset cursor-pointer p-3 mb-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg glow-primary">
              <Moon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Dark Mode</div>
              <div className="text-xs text-muted-foreground">Deep cyber space</div>
            </div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="rounded-xl transition-cyber hover:neo-inset cursor-pointer p-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-cyber rounded-lg glow-cyber">
              <Monitor className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold text-foreground">System</div>
              <div className="text-xs text-muted-foreground">Auto-adaptive mode</div>
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
