import type { Metadata } from "next";
import FounderPageClient from "./FounderPageClient";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("founder") },
  description:
    "Institutional biography of the founder of Avatar Institut für Metaphysik GmbH.",
};

export default function FounderPage() {
  return <FounderPageClient />;
}
