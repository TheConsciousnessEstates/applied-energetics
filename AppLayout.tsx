import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/protocols", label: "Protocols" },
  { href: "/log", label: "Sessions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile", label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: userData } = trpc.user.me.useQuery(undefined, { enabled: isAuthenticated });

  const tier = userData?.user?.subscriptionTier ?? "free";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <div className="flex items-center gap-2 cursor-pointer group">
              <Zap className="w-5 h-5 text-primary group-hover:text-accent transition-colors" />
              <span className="font-display font-black text-lg uppercase tracking-widest text-foreground">
                Applied<span className="text-primary">Energetics</span>
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`font-display text-xs uppercase tracking-widest px-3 py-2 border-b-2 transition-colors cursor-pointer ${
                      location === link.href
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span
                  className={`hidden md:inline-flex ${
                    tier === "elite" ? "tier-elite" : tier === "pro" ? "tier-pro" : "tier-free"
                  }`}
                >
                  {tier.toUpperCase()}
                </span>
                <Link href="/profile">
                  <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <span className="font-mono text-xs text-foreground">
                      {(user?.name ?? "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <button onClick={() => startLogin()} className="brut-btn-primary text-xs py-2 px-4">
                Enter
              </button>
            )}

            {/* Mobile menu toggle */}
            {isAuthenticated && (
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && isAuthenticated && (
          <div className="md:hidden border-t border-border bg-card animate-slide-up">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`px-6 py-4 font-display text-sm uppercase tracking-widest border-b border-border cursor-pointer ${
                    location === link.href ? "text-primary bg-primary/5" : "text-muted-foreground"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-muted-foreground">
            APPLIED ENERGETICS — BREATH IS ARMOR
          </span>
          <div className="flex items-center gap-6">
            <Link href="/pricing">
              <span className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Pricing
              </span>
            </Link>
            <Link href="/terms">
              <span className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Terms
              </span>
            </Link>
            <Link href="/privacy">
              <span className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Privacy
              </span>
            </Link>
            <Link href="/disclaimer">
              <span className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Disclaimer
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
