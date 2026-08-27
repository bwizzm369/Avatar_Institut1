import { getAdminAccess } from "@/lib/admin/access";
import { buildCoursesTemplateWorkbook } from "@/lib/admin/courses/parse-file";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return new Response("Access denied", { status: 403 });
  }

  const buffer = buildCoursesTemplateWorkbook();
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="avatar-institute-courses-import-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
