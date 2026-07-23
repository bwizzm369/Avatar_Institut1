import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("courses") },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
