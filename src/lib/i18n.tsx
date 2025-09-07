"use client";

import React, {createContext, useContext} from "react";

export type Messages = Record<string, unknown>;

const Ctx = createContext<{locale: string; messages: Messages}>({
  locale: "en",
  messages: {},
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{locale, messages}}>{children}</Ctx.Provider>;
}

export function useT(namespace?: string) {
  const {messages} = useContext(Ctx);
  return (key: string): string => {
    if (!namespace) return String((messages as Record<string, unknown>)?.[key] ?? key);
    const nsDict = (messages as Record<string, unknown>)?.[namespace];
    if (nsDict && typeof nsDict === "object") {
      return String((nsDict as Record<string, unknown>)?.[key] ?? key);
    }
    return key;
  };
}

