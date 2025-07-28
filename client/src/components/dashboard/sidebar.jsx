import { useLocation, Link } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Network, Users, Sparkles, Settings, LogOut, CheckCircle, BarChart, Airplay, LayoutDashboardIcon, Target, Monitor } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const baseRoutes = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Tasks", href: "/tasks", icon: CheckSquare },
    { title: "Dependencies", href: "/dependencies", icon: Network },
    { title: "Departments", href: "/departments", icon: Users },
    { title: "AI Optimization", href: "/optimization", icon: Sparkles },
     { title: "All Aims", href: "/all-aims", icon: Target },
    { title: "Completed Tasks", href: "/completedtask", icon: CheckCircle },
     { title: "Leaderboard", href: "/leaderboard", icon: Sparkles },
  ];

  // Admin-only routes
  const adminRoutes = [
    { title: "Employee Monitoring", href: "/monitoring", icon: Monitor },
  ];

  // User-specific routes
  const userRoutes = [
    { title: "Dashboard", href: "/userdashboard", icon: LayoutDashboardIcon },
    { title: "Progress", href: "/progress", icon: BarChart },
    { title: "Set Aims", href: "/aims", icon: Airplay },
     { title: "Leaderboard", href: "/leaderboard", icon: Sparkles },
  ];

  // Determine which routes to show based on user role
  let renderRoutes;
  if (user?.role === "User") {
    renderRoutes = userRoutes;
  } else if (user?.role === "Admin") {
    renderRoutes = [...baseRoutes, ...adminRoutes];
  } else {
    renderRoutes = baseRoutes; // For other roles like Manager, etc.
  }

  return (
    <div className="h-screen flex flex-col bg-background neo-card border-r border-border/50 shadow-neo-light overflow-hidden">
      {/* Enhanced Cyber Header */}
      <div className="border-b border-border/50 bg-card relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
        <div className="flex items-center px-6 py-6 relative z-10">
          <div className="flex items-center gap-4 font-bold text-2xl">
            <div className="relative">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center glow-primary animate-glow-pulse transform rotate-12 hover:rotate-0 transition-cyber">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <span className="text-foreground font-bold">
              Infiverse
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="p-6">
          <div className="mb-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Navigation
            </div>
            <nav className="space-y-3">
              {renderRoutes.map((route) => {
                const isActive = location.pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    to={route.href}
                    className={`group flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-cyber relative overflow-hidden hover-cyber ${
                      isActive
                        ? "gradient-primary text-primary-foreground glow-primary"
                        : "neo-inset hover:neo-card hover:text-primary text-foreground/90"
                    }`}
                  >
                    {/* Cyber Active indicator */}
                    {isActive && (
                      <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse-cyber"></div>
                    )}

                    {/* Enhanced Icon */}
                    <div className={`relative z-10 p-2 rounded-lg transition-cyber ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/10 text-primary/80 group-hover:bg-primary/20 group-hover:text-primary'
                    }`}>
                      <route.icon className="h-5 w-5" />
                    </div>

                    {/* Text with cyber styling */}
                    <span className="relative z-10 transition-cyber">
                      {route.title}
                    </span>

                    {/* Cyber glow effect */}
                    {isActive && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary-foreground rounded-full animate-pulse-cyber"></div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Enhanced Workspace Section */}
          <div className="mt-8">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Workspace
            </div>
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">Default Workspace</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Footer Section */}
      <div className="border-t border-border/50 p-6 bg-gradient-to-r from-background to-primary/5 flex-shrink-0">
        <div className="space-y-2">
          <Link
            to="/settings"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-primary/5 hover:text-primary text-foreground/70 transition-all duration-300 hover-lift"
          >
            <Settings className="h-5 w-5 transition-colors duration-300" />
            <span>Settings</span>
          </Link>

          {/* Enhanced User Profile Card */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{user?.name || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.role || "User"}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-300 hover-lift"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
