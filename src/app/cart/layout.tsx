import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("cart") },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
