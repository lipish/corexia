import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import "../globals.css";

export const metadata: Metadata = {
  title: "LLM Platform",
  description: "End-to-end platform for LLM & GenAI",
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh-CN" }, { locale: "zh-TW" }];
}

async function getMessages(locale: string) {
  try {
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return messages;
  } catch {
    return notFound();
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <AppShell locale={locale}>{children}</AppShell>
    </I18nProvider>
  );
}

