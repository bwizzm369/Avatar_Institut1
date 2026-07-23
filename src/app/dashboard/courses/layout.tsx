import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboardCourses") },
};

export default function DashboardCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
