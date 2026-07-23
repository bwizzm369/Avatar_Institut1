import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("login") },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
