import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { normalizeWhitespace } from "@/lib/admin/import/normalize";
import { isConsultationStatus } from "@/lib/consultation/validation";
import type {
  ConsultationRequestRecord,
  ConsultationStatus,
} from "@/lib/consultation/types";

export type AdminConsultationListItem = ConsultationRequestRecord;

export async function listAdminConsultationRequests(options: {
  query?: string;
  status?: string;
}): Promise<{
  requests: AdminConsultationListItem[];
  query: string;
  status: ConsultationStatus | "all";
}> {
  const query = normalizeWhitespace(options.query ?? "");
  const rawStatus = options.status ?? "";
  const statusFilter: ConsultationStatus | "all" = isConsultationStatus(rawStatus)
    ? rawStatus
    : "all";

  if (!isSupabaseConfigured()) {
    return { requests: [], query, status: statusFilter };
  }

  const supabase = await createServerSupabaseClient();
  let builder = supabase
    .from("consultation_requests")
    .select(
      "id, full_name, email, phone, locale, request_type, message, status, admin_notes, consent_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    builder = builder.eq("status", statusFilter);
  }

  const { data, error } = await builder;
  if (error || !data) {
    return { requests: [], query, status: statusFilter };
  }

  const requests = query
    ? data.filter((row) => {
        const hay =
          `${row.full_name} ${row.email} ${row.phone} ${row.message}`.toLowerCase();
        return hay.includes(query.toLowerCase());
      })
    : data;

  return {
    requests: requests as AdminConsultationListItem[],
    query,
    status: statusFilter,
  };
}
