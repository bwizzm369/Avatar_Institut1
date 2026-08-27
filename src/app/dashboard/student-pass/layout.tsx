import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboardStudentPass") },
};

export default function DashboardStudentPassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
