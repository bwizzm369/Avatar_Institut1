import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("courseDetail") },
};

export default function CourseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
