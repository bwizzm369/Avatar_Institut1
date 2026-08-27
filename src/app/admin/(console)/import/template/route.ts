import { getAdminAccess } from "@/lib/admin/access";
import { buildImportTemplateWorkbook } from "@/lib/admin/import/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return new Response("Access denied", { status: 403 });
  }

  const buffer = buildImportTemplateWorkbook();
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="avatar-institute-student-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
