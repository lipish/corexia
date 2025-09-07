"use client";

import {useRouter, usePathname} from "next/navigation";
import {useMemo} from "react";

const SUPPORTED = [
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
  { code: "zh-TW", name: "繁體中文" },
];

export function LocaleSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const options = useMemo(() => SUPPORTED, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    if (!pathname) return;
    const parts = pathname.split("/");
    // ['', 'en', ...]
    if (parts.length > 1) {
      parts[1] = newLocale;
      const newPath = parts.join("/") || "/";
      router.push(newPath);
    } else {
      router.push(`/${newLocale}`);
    }
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="h-8 rounded-md border bg-background px-2 text-sm"
      aria-label="Select language"
    >
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

