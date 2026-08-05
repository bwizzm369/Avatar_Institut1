import type { Metadata } from "next";
import HomePage from "./HomePage";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("home") },
  description:
    "Avatar Institut für Metaphysik — international academy for metaphysics, consciousness, and human development in English and Arabic.",
};

export default function Page() {
  return <HomePage />;
}
