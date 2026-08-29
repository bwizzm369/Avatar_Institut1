export type LegacyMatchStatus =
  | "none"
  | "linked"
  | "pending_review"
  | "unmatched";

export type LegacyStudentMatchRow = {
  id: string;
  email: string | null;
  linked_profile_id: string | null;
};

export type CertificateMatchRow = {
  certificate_number: string;
  legacy_student_id: string | null;
  profile_id: string | null;
  legacy: LegacyStudentMatchRow | null;
};

export type LegacyMatchDecision = {
  status: LegacyMatchStatus;
  legacyStudentId: string | null;
};

export type DecideLegacyMatchInput = {
  previouslyStudied: boolean;
  signupEmail: string;
  declaredCertificateNumber: string | null;
  emailMatches: LegacyStudentMatchRow[];
  certificate: CertificateMatchRow | null;
};

function normalizeMatchEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Conservative legacy matching. Auto-link only on a unique strong match:
 * 1. Exact unique unlinked legacy email
 * 2. Exact official certificate_number whose legacy holder email matches
 *
 * Never matches on name, course, phone, or old_certificate_number.
 * Never creates a certificate.
 */
export function decideLegacyMatch(
  input: DecideLegacyMatchInput,
): LegacyMatchDecision {
  if (!input.previouslyStudied) {
    return { status: "none", legacyStudentId: null };
  }

  const signupEmail = normalizeMatchEmail(input.signupEmail);
  const declaredNumber = (input.declaredCertificateNumber ?? "").trim();
  const certificateLookedUp = declaredNumber.length > 0;

  if (input.emailMatches.length > 1) {
    return { status: "pending_review", legacyStudentId: null };
  }

  const emailCandidate =
    input.emailMatches.length === 1 ? input.emailMatches[0] : null;
  const certOwner = input.certificate?.legacy ?? null;

  if (
    certOwner &&
    emailCandidate &&
    certOwner.id !== emailCandidate.id
  ) {
    return { status: "pending_review", legacyStudentId: null };
  }

  const cas1 =
    emailCandidate != null && emailCandidate.linked_profile_id == null;

  const cas2 =
    certOwner != null &&
    normalizeMatchEmail(certOwner.email) === signupEmail &&
    certOwner.linked_profile_id == null;

  if (cas2 && certOwner) {
    return { status: "linked", legacyStudentId: certOwner.id };
  }

  if (certificateLookedUp && input.certificate) {
    return { status: "pending_review", legacyStudentId: null };
  }

  if (cas1 && emailCandidate) {
    return { status: "linked", legacyStudentId: emailCandidate.id };
  }

  if (emailCandidate?.linked_profile_id) {
    return { status: "pending_review", legacyStudentId: null };
  }

  return { status: "unmatched", legacyStudentId: null };
}

export type LegacyMatchStore = {
  findLegacyStudentsByEmail: (
    email: string,
  ) => Promise<LegacyStudentMatchRow[]>;
  findCertificateByNumber: (
    certificateNumber: string,
  ) => Promise<CertificateMatchRow | null>;
  linkLegacyStudent: (
    legacyStudentId: string,
    profileId: string,
  ) => Promise<boolean>;
  updateProfileMatchStatus: (
    profileId: string,
    status: LegacyMatchStatus,
  ) => Promise<void>;
};

export async function applyLegacyMatchDecision(
  input: {
    profileId: string;
    email: string;
    previouslyStudied: boolean;
    declaredCertificateNumber: string | null;
  },
  store: LegacyMatchStore,
): Promise<LegacyMatchDecision> {
  if (!input.previouslyStudied) {
    return { status: "none", legacyStudentId: null };
  }

  const email = input.email.trim().toLowerCase();
  const declared = (input.declaredCertificateNumber ?? "").trim() || null;

  const [emailMatches, certificate] = await Promise.all([
    store.findLegacyStudentsByEmail(email),
    declared ? store.findCertificateByNumber(declared) : Promise.resolve(null),
  ]);

  const decision = decideLegacyMatch({
    previouslyStudied: true,
    signupEmail: email,
    declaredCertificateNumber: declared,
    emailMatches,
    certificate,
  });

  if (decision.status === "linked" && decision.legacyStudentId) {
    const linked = await store.linkLegacyStudent(
      decision.legacyStudentId,
      input.profileId,
    );
    if (!linked) {
      await store.updateProfileMatchStatus(input.profileId, "pending_review");
      return { status: "pending_review", legacyStudentId: null };
    }
  }

  await store.updateProfileMatchStatus(input.profileId, decision.status);
  return decision;
}
