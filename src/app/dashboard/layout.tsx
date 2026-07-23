import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboard") },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
