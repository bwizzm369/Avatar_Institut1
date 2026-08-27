import type { Locale } from "@/types";

export type CertificatePdfCopy = {
  documentTitle: string;
  institute: string;
  title: string;
  intro: string;
  completed: string;
  dateLabel: string;
  numberLabel: string;
  verify: string;
  signature: string;
  seal: string;
  revoked: string;
};

const COPY: Record<Locale, CertificatePdfCopy> = {
  en: {
    documentTitle: "Certificate",
    institute: "Avatar Institut für Metaphysik GmbH",
    title: "Certificate",
    intro: "certifies that",
    completed: "has successfully completed the programme",
    dateLabel: "Date of issue",
    numberLabel: "Official number",
    verify: "Verify this certificate",
    signature: "Signature",
    seal: "Official seal",
    revoked: "Revoked",
  },
  ar: {
    documentTitle: "شهادة",
    institute: "Avatar Institut für Metaphysik GmbH",
    title: "شهادة",
    intro: "يشهد بأن",
    completed: "قد أتم بنجاح برنامج",
    dateLabel: "تاريخ الإصدار",
    numberLabel: "الرقم الرسمي",
    verify: "تحقق من هذه الشهادة",
    signature: "التوقيع",
    seal: "الختم الرسمي",
    revoked: "ملغاة",
  },
};

export function certificatePdfCopy(locale: Locale): CertificatePdfCopy {
  return COPY[locale];
}
