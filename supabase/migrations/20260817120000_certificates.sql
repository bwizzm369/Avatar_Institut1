-- Avatar Institut — Lot Certificats 1: schema, numbering, RLS, public verify RPC
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.
-- Does not issue certificates, generate QR/PDF, or change Student Pass / Stripe / video.

-- ---------------------------------------------------------------------------
-- certificate_year_counters — atomic per-year sequence (no MAX()+1)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.certificate_year_counters (
  year INTEGER PRIMARY KEY
    CHECK (year >= 2000 AND year <= 2100),
  last_value INTEGER NOT NULL DEFAULT 0
    CHECK (last_value >= 0)
);

COMMENT ON TABLE public.certificate_year_counters IS
  'Per-year sequence for official certificate numbers AVT-YYYY-XXXXXX. Updated only by next_certificate_number().';

-- ---------------------------------------------------------------------------
-- certificates — official issued documents (modern + legacy holders)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  issued_at DATE NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.profiles (id) ON DELETE RESTRICT,
  legacy_student_id UUID REFERENCES public.legacy_students (id) ON DELETE RESTRICT,
  enrollment_id UUID REFERENCES public.enrollments (id) ON DELETE SET NULL,
  legacy_completion_id UUID REFERENCES public.legacy_course_completions (id) ON DELETE SET NULL,
  old_certificate_number TEXT,
  language TEXT,
  holder_display_name TEXT NOT NULL,
  course_title_ar TEXT NOT NULL DEFAULT '',
  course_title_en TEXT NOT NULL DEFAULT '',
  issued_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.certificates IS
  'Official Avatar Institut certificates. Revoke via status=revoked; never DELETE. Public verify uses snapshots only.';

COMMENT ON COLUMN public.certificates.certificate_number IS
  'Official number AVT-YYYY-XXXXXX. Never replaced by old_certificate_number.';

COMMENT ON COLUMN public.certificates.old_certificate_number IS
  'Historical / pre-platform number, stored as-is. Not unique. Not used for public verify URLs.';

COMMENT ON COLUMN public.certificates.holder_display_name IS
  'Public snapshot of the holder name at issuance. Do not join profiles/legacy_students for /verify.';

COMMENT ON COLUMN public.certificates.course_title_ar IS
  'Public snapshot of the Arabic course title at issuance.';

COMMENT ON COLUMN public.certificates.course_title_en IS
  'Public snapshot of the English course title at issuance.';

COMMENT ON COLUMN public.certificates.revoked_reason IS
  'Admin-only. Must never be returned by verify_certificate().';

-- Unique official number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_certificate_number_key'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_certificate_number_format_chk'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_certificate_number_format_chk
      CHECK (certificate_number ~ '^AVT-[0-9]{4}-[0-9]{6}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_status_chk'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_status_chk
      CHECK (status IN ('issued', 'revoked'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_revocation_chk'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_revocation_chk
      CHECK (
        (status = 'issued' AND revoked_at IS NULL)
        OR status = 'revoked'
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_language_chk'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_language_chk
      CHECK (language IS NULL OR language IN ('en', 'ar'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'certificates_holder_chk'
      AND conrelid = 'public.certificates'::regclass
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_holder_chk
      CHECK (profile_id IS NOT NULL OR legacy_student_id IS NOT NULL);
  END IF;
END $$;

-- Partial unique indexes (NULL-safe anti-duplication)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_legacy_completion_id_uidx
  ON public.certificates (legacy_completion_id)
  WHERE legacy_completion_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certificates_profile_course_uidx
  ON public.certificates (profile_id, course_id)
  WHERE profile_id IS NOT NULL AND course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certificates_legacy_student_course_uidx
  ON public.certificates (legacy_student_id, course_id)
  WHERE legacy_student_id IS NOT NULL AND course_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS certificates_profile_id_idx
  ON public.certificates (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS certificates_legacy_student_id_idx
  ON public.certificates (legacy_student_id)
  WHERE legacy_student_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS certificates_status_idx
  ON public.certificates (status);

DROP TRIGGER IF EXISTS certificates_set_updated_at ON public.certificates;
CREATE TRIGGER certificates_set_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- next_certificate_number(year) — atomic AVT-YYYY-XXXXXX
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.next_certificate_number(p_year INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  IF p_year IS NULL OR p_year < 2000 OR p_year > 2100 THEN
    RAISE EXCEPTION 'invalid certificate year';
  END IF;

  IF NOT (
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'not authorized to allocate certificate numbers';
  END IF;

  INSERT INTO public.certificate_year_counters (year, last_value)
  VALUES (p_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_value = public.certificate_year_counters.last_value + 1
  RETURNING last_value INTO v_next;

  RETURN 'AVT-' || p_year::TEXT || '-' || lpad(v_next::TEXT, 6, '0');
END;
$$;

COMMENT ON FUNCTION public.next_certificate_number(INTEGER) IS
  'Atomically allocates the next official certificate number for a year. Uses row-level upsert, never MAX()+1.';

REVOKE ALL ON FUNCTION public.next_certificate_number(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_certificate_number(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_certificate_number(INTEGER) TO service_role;

-- ---------------------------------------------------------------------------
-- certificate_is_own — SECURITY DEFINER so students can match linked legacy
-- rows without a direct SELECT on legacy_students (admin-private).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.certificate_is_own(
  p_profile_id UUID,
  p_legacy_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.legacy_students ls
      WHERE ls.id = p_legacy_student_id
        AND ls.linked_profile_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.certificate_is_own(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.certificate_is_own(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- verify_certificate — public RPC, snapshots only (no private columns)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_certificate(p_number TEXT)
RETURNS TABLE (
  certificate_number TEXT,
  status TEXT,
  holder_display_name TEXT,
  course_title_en TEXT,
  course_title_ar TEXT,
  issued_at DATE
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.certificate_number,
    c.status,
    c.holder_display_name,
    c.course_title_en,
    c.course_title_ar,
    c.issued_at
  FROM public.certificates c
  WHERE c.certificate_number = btrim(p_number);
$$;

COMMENT ON FUNCTION public.verify_certificate(TEXT) IS
  'Public certificate verification. Returns snapshots only. Never email, phone, notes, UUIDs, or revoked_reason.';

REVOKE ALL ON FUNCTION public.verify_certificate(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Grants — anon has no table access; authenticated has no DELETE
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE public.certificates FROM PUBLIC;
REVOKE ALL ON TABLE public.certificates FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.certificates TO authenticated;
GRANT ALL ON TABLE public.certificates TO service_role;

REVOKE ALL ON TABLE public.certificate_year_counters FROM PUBLIC;
REVOKE ALL ON TABLE public.certificate_year_counters FROM anon;
REVOKE ALL ON TABLE public.certificate_year_counters FROM authenticated;
GRANT SELECT ON TABLE public.certificate_year_counters TO authenticated;
GRANT ALL ON TABLE public.certificate_year_counters TO service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_year_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_select_own" ON public.certificates;
CREATE POLICY "certificates_select_own"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (public.certificate_is_own(profile_id, legacy_student_id));

DROP POLICY IF EXISTS "certificates_select_admin" ON public.certificates;
CREATE POLICY "certificates_select_admin"
  ON public.certificates
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "certificates_insert_admin" ON public.certificates;
CREATE POLICY "certificates_insert_admin"
  ON public.certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "certificates_update_admin" ON public.certificates;
CREATE POLICY "certificates_update_admin"
  ON public.certificates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Intentionally no DELETE policy on certificates (revoke, do not delete).

DROP POLICY IF EXISTS "certificate_year_counters_select_admin"
  ON public.certificate_year_counters;
CREATE POLICY "certificate_year_counters_select_admin"
  ON public.certificate_year_counters
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
