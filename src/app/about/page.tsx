import type { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("about") },
  description:
    "About Avatar Institut für Metaphysik GmbH — institutional mission and founder overview.",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
