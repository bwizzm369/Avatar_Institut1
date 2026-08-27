"use server";

import { revalidatePath } from "next/cache";
import { getAdminAccess } from "@/lib/admin/access";
import {
  createCertificateIssueStore,
  issueCertificate,
  type IssueCertificateInput,
  type IssueCertificateResult,
} from "@/lib/admin/certificates/issue";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function issueCertificateAction(
  input: IssueCertificateInput,
): Promise<IssueCertificateResult> {
  const access = await getAdminAccess();
  if (access.status !== "ok") {
    return { ok: false, error: "Access denied." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const client = await createServerSupabaseClient();
  const result = await issueCertificate({
    store: createCertificateIssueStore(client),
    context: "admin",
    input: {
      holderKey: input.holderKey,
      itemKey: input.itemKey,
      issuedAt: input.issuedAt,
      language: input.language,
      oldCertificateNumber: input.oldCertificateNumber,
    },
  });

  if (result.ok || result.alreadyExists) {
    revalidatePath("/admin/certificates");
    revalidatePath("/admin");
  }

  return result;
}
