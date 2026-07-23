import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("signup") },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
