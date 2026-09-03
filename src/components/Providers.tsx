"use client";

import { CartProvider } from "@/components/CartProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthRecoveryRedirect } from "@/components/AuthRecoveryRedirect";
import { DocumentTitle } from "@/components/DocumentTitle";
import { LocaleProvider } from "@/components/LocaleProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AuthRecoveryRedirect />
        <CartProvider>
          <DocumentTitle />
          {children}
        </CartProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
