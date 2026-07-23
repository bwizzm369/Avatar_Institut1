import type { Metadata } from "next";
import HomePage from "./HomePage";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("home") },
};

export default function Page() {
  return <HomePage />;
}
