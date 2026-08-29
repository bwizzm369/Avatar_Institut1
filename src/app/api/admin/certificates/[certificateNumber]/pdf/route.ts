import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin/access";
import {
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import { denyCertificatePdfAccess } from "@/lib/certificates/pdf/access";
import { generateCertificatePdf } from "@/lib/certificates/pdf/generate";
import { loadCertificatePdfRecord } from "@/lib/certificates/pdf/load";
import { isOfficialPdfOriginError } from "@/lib/certificates/pdf/origin-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateNumber: string }> },
): Promise<Response> {
  const access = await getAdminAccess();
  const denied = denyCertificatePdfAccess(access);
  if (denied) {
    return NextResponse.json(
      { ok: false, error: denied.error },
      { status: denied.status },
    );
  }

  const { certificateNumber: rawNumber } = await context.params;
  const officialNumber = normalizeCertificateNumberInput(rawNumber);
  if (!isValidCertificateNumber(officialNumber)) {
    return NextResponse.json(
      { ok: false, error: "Invalid certificate number." },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const record = await loadCertificatePdfRecord(supabase, officialNumber);
  if (!record) {
    return NextResponse.json(
      { ok: false, error: "Certificate not found." },
      { status: 404 },
    );
  }

  try {
    const pdf = await generateCertificatePdf(record);
    const body = Buffer.from(pdf.bytes);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (isOfficialPdfOriginError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unable to generate the certificate PDF." },
      { status: 500 },
    );
  }
}
