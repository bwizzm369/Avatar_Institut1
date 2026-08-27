import type { Metadata } from "next";
import { CertificateVerifyClient } from "@/components/CertificateVerifyClient";
import { lookupPublicCertificate } from "@/lib/certificates/lookup";
import { englishAbsoluteTitle } from "@/lib/titles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: englishAbsoluteTitle("verifyCertificate") },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ certificateNumber: string }>;
}) {
  const { certificateNumber } = await params;
  const view = await lookupPublicCertificate(certificateNumber);
  return <CertificateVerifyClient view={view} />;
}
