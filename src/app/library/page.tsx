import type { Metadata } from "next";
import { LibraryClient } from "@/components/LibraryClient";
import { getPublishedLibraryResources } from "@/lib/library";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("library") },
  description:
    "Avatar Institut digital library with public external resources including videos, books, research, podcasts, and official free PDFs.",
};

export default function LibraryPage() {
  const resources = getPublishedLibraryResources();

  return <LibraryClient resources={resources} />;
}
