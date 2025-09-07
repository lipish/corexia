"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Database, Wand2, Boxes, Play, BarChart3, Settings } from "lucide-react";
import { useT } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/datasets", key: "datasets", icon: Database },
  { href: "/finetunes", key: "finetunes", icon: Wand2 },
  { href: "/models", key: "models", icon: Boxes },
  { href: "/inference", key: "inference", icon: Play },
  { href: "/evaluations", key: "evaluations", icon: BarChart3 },
  { href: "/settings", key: "settings", icon: Settings },
];

export function AppShell({ children, locale }: { children: React.ReactNode; locale: string }) {
  const pathname = usePathname();
  const t = useT("nav");
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r bg-background">
        <div className="px-4 py-3 text-lg font-semibold">LLM Platform</div>
        <nav className="px-2 py-2 space-y-1">
          {NAV.map((item) => {
            const href = `/${locale}${item.href}`;
            const active = pathname?.startsWith(href);
            const Icon = item.icon;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex flex-col min-h-screen">
        <header className="border-b px-6 py-3 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">{t("title")}</span>
          <LocaleSwitcher current={locale} />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

