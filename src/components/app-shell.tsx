"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Database, Wand2, Boxes, Play, BarChart3, Settings, Search, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { UserMenu } from "@/components/user-menu";

const SECTIONS = [
  { title: "Overview", items: [ { href: "/dashboard", key: "dashboard", icon: LayoutDashboard } ] },
  { title: "Workspace", items: [
      { href: "/datasets", key: "datasets", icon: Database },
      { href: "/finetunes", key: "finetunes", icon: Wand2 },
      { href: "/models", key: "models", icon: Boxes },
      { href: "/inference", key: "inference", icon: Play },
      { href: "/evaluations", key: "evaluations", icon: BarChart3 },
    ] },
  { title: "Settings", items: [ { href: "/settings", key: "settings", icon: Settings } ] },
] as const;

export function AppShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  return (
    <AuthProvider>
      <AppFrame locale={locale}>{children}</AppFrame>
    </AuthProvider>
  );
}

function AppFrame({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT("nav");
  const { user } = useAuth();

  const base = `/${locale}`;
  const isLogin = pathname?.startsWith(`${base}/login`);

  // sidebar collapsed state (persisted)
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("corexia:sidebarCollapsed");
      if (raw) setCollapsed(raw === "1");
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem("corexia:sidebarCollapsed", collapsed ? "1" : "0");
    } catch {}
  }, [collapsed]);
  // keyboard shortcut Cmd/Ctrl+B to toggle collapse
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // organization selector (persisted)
  const [org, setOrg] = React.useState<string>("Corexia");
  React.useEffect(() => {
    try { const raw = localStorage.getItem("corexia:org"); if (raw) setOrg(raw); } catch {}
  }, []);
  React.useEffect(() => {
    try { localStorage.setItem("corexia:org", org); } catch {}
  }, [org]);

  // mobile drawer
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // counts (datasets)
  const { data: datasetsData } = useDatasets();
  const datasetsCount = Array.isArray(datasetsData) ? datasetsData.length : 0;

  const toggleSidebar = () => setCollapsed((c) => !c);

  // Redirect unauthenticated users to login (except on login route)
  React.useEffect(() => {
    if (!user && !isLogin) router.push(`${base}/login`);
  }, [user, isLogin, router, base]);

  if (isLogin) {
    return <main className="min-h-screen flex items-center justify-center p-6 w-full">{children}</main>;
  }

  return (
    <div className={cn("min-h-screen bg-background", collapsed ? "md:grid md:grid-cols-[56px_1fr]" : "md:grid md:grid-cols-[240px_1fr]") }>
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex border-r bg-muted/30 flex-col">
        <div className={cn("px-4 py-4 font-semibold", collapsed ? "text-base text-center" : "text-lg")}>{collapsed ? "CX" : "Corexia"}</div>
        {!collapsed && (
          <div className="px-3 pb-3">
            <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={org} onChange={(e)=>setOrg(e.target.value)}>
              <option value="Corexia">Corexia</option>
              <option value="Sandbox">Sandbox</option>
            </select>
          </div>
        )}
        <nav className="px-2 py-2 space-y-1 overflow-y-auto">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{section.title}</div>
              )}
              {section.items.map((item) => {
                const href = `${base}${item.href}`;
                const active = pathname?.startsWith(href);
                const Icon = item.icon;
                const showBadge = item.key === "datasets" && datasetsCount > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    title={t(item.key)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-md text-sm border-l-2 hover:bg-accent/60 hover:text-accent-foreground",
                      collapsed ? "justify-center px-0 py-2" : "px-3 py-2",
                      active ? "border-primary bg-accent text-accent-foreground font-medium" : "border-transparent text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{t(item.key)}</span>}
                    {!collapsed && (showBadge || active) && (
                      <span className="ml-auto flex items-center gap-2">
                        {showBadge && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground/80">{datasetsCount}</span>
                        )}
                        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="mt-auto p-2">
          <button onClick={toggleSidebar} className="w-full flex items-center justify-center h-8 rounded border text-xs text-muted-foreground hover:bg-accent/60">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex flex-col min-h-screen">
        <header className="border-b px-4 md:px-6 h-14 flex items-center gap-3">
          {/* Mobile: hamburger */}
          <button className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded border" onClick={() => setMobileOpen(true)}>
            <Menu className="h-4 w-4" />
          </button>
          {!collapsed && (
            <div className="relative w-full max-w-md hidden md:block">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </span>
              <input
                className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm"
                placeholder="Search..."
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher current={locale} />
            <UserMenu locale={locale} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-muted/30 border-r p-3 flex flex-col">
            <div className="px-1 py-2 font-semibold">Corexia</div>
            <div className="px-1 pb-3">
              <select className="h-8 w-full rounded-md border bg-background px-2 text-xs" value={org} onChange={(e)=>setOrg(e.target.value)}>
                <option value="Corexia">Corexia</option>
                <option value="Sandbox">Sandbox</option>
              </select>
            </div>
            <nav className="space-y-1 overflow-y-auto">
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-2">
                  <div className="px-1 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{section.title}</div>
                  {section.items.map((item) => {
                    const href = `${base}${item.href}`;
                    const active = pathname?.startsWith(href);
                    const Icon = item.icon;
                    const showBadge = item.key === "datasets" && datasetsCount > 0;
                    return (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent/60 hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground"
                      )}>
                        <Icon className="h-4 w-4" />
                        <span>{t(item.key)}</span>
                        {(showBadge || active) && (
                          <span className="ml-auto flex items-center gap-2">
                            {showBadge && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground/80">{datasetsCount}</span>}
                            {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

