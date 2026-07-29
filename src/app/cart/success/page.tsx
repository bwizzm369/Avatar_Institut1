import type { Metadata } from "next";
import { Suspense } from "react";
import { englishAbsoluteTitle } from "@/lib/titles";
import CartSuccessClient from "./CartSuccessClient";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("cartSuccess") },
};

export default function CartSuccessRoute() {
  return (
    <Suspense fallback={null}>
      <CartSuccessClient />
    </Suspense>
  );
}
