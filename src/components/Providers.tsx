"use client";

import { CartProvider } from "@/components/CartProvider";
import { DocumentTitle } from "@/components/DocumentTitle";
import { LocaleProvider } from "@/components/LocaleProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <CartProvider>
        <DocumentTitle />
        {children}
      </CartProvider>
    </LocaleProvider>
  );
}
