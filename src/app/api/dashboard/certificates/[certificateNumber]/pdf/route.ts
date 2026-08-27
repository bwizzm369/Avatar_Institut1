import { NextResponse } from "next/server";
import {
  isValidCertificateNumber,
  normalizeCertificateNumberInput,
} from "@/lib/certificates/number";
import { generateCertificatePdf } from "@/lib/certificates/pdf/generate";
import { isOfficialPdfOriginError } from "@/lib/certificates/pdf/origin-error";
import { loadOwnedStudentCertificatePdfRecord } from "@/lib/certificates/student";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateNumber: string }> },
): Promise<Response> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required." },
      { status: 401 },
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

  const record = await loadOwnedStudentCertificatePdfRecord(
    supabase,
    user.id,
    officialNumber,
  );
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
