import type { Metadata } from "next";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("dashboardCertificates") },
};

export default function DashboardCertificatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
