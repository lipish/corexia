"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function UserMenu({ locale }: { locale: string }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const base = `/${locale}`;

  return (
    <div className="relative group">
      <button className="h-9 rounded-md border px-3 text-sm">
        {user.name}
      </button>
      <div className="absolute right-0 mt-2 hidden group-hover:block z-50 w-40 rounded-md border bg-popover text-popover-foreground shadow">
        <div className="py-1 text-sm">
          <Link href={`${base}/settings`} className={menuItem(pathname?.startsWith(`${base}/settings`))}>Settings</Link>
          <button onClick={logout} className={menuItem(false)}>Logout</button>
        </div>
      </div>
    </div>
  );
}

function menuItem(active: boolean) {
  return cn(
    "block w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground",
    active && "bg-accent text-accent-foreground"
  );
}

