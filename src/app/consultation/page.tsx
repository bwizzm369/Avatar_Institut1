import type { Metadata } from "next";
import { ConsultationFormClient } from "@/components/ConsultationFormClient";
import { ConsultationPageCopy } from "@/components/ConsultationPageCopy";
import { englishAbsoluteTitle } from "@/lib/titles";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("consultation") },
  description:
    "Request a private consultation or information about Avatar Institut programmes in English or Arabic.",
};

export default function ConsultationPage() {
  return (
    <div className="consultation-page">
      <ConsultationPageCopy />
      <section className="section consultation-section">
        <div className="container consultation-layout">
          <ConsultationFormClient />
        </div>
      </section>
    </div>
  );
}
