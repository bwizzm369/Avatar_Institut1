-- Avatar Institut — Lot Certificats 3B: atomic admin issuance
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.
-- Allocates AVT-YYYY-XXXXXX via next_certificate_number() and inserts in one
-- function (one transaction). If INSERT fails, the year counter is rolled back.
-- Reconstructs holder name and course titles from live rows. Does not accept a
-- client certificate_number. Does not revoke, generate QR/PDF, or change
-- Student Pass / Stripe / video.

DROP FUNCTION IF EXISTS public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.issue_certificate(
  p_issued_at DATE,
  p_course_id UUID,
  p_profile_id UUID,
  p_legacy_student_id UUID,
  p_enrollment_id UUID,
  p_legacy_completion_id UUID,
  p_old_certificate_number TEXT,
  p_language TEXT
)
RETURNS TABLE (
  certificate_number TEXT,
  already_existed BOOLEAN,
  status TEXT,
  holder_display_name TEXT,
  course_title_en TEXT,
  course_title_ar TEXT,
  issued_at DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_number TEXT;
  v_existing public.certificates%ROWTYPE;
  v_inserted public.certificates%ROWTYPE;
  v_holder TEXT;
  v_title_ar TEXT;
  v_title_en TEXT;
  v_old TEXT;
  v_language TEXT;
  v_enroll_user UUID;
  v_enroll_course UUID;
  v_comp_student UUID;
  v_comp_course UUID;
  v_comp_title TEXT;
  v_comp_old TEXT;
  v_comp_language TEXT;
  v_linked_profile UUID;
  v_legacy_name TEXT;
  v_first TEXT;
  v_last TEXT;
  v_profile_locale TEXT;
  v_course_en TEXT;
  v_course_ar TEXT;
BEGIN
  IF NOT (
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    OR public.is_admin()
  ) THEN
    RAISE EXCEPTION 'not authorized to issue certificates'
      USING ERRCODE = '42501';
  END IF;

  IF p_issued_at IS NULL THEN
    RAISE EXCEPTION 'invalid issue date';
  END IF;

  v_year := EXTRACT(YEAR FROM p_issued_at)::INTEGER;
  IF v_year < 2000 OR v_year > 2100 THEN
    RAISE EXCEPTION 'invalid issue date';
  END IF;

  IF p_profile_id IS NULL AND p_legacy_student_id IS NULL THEN
    RAISE EXCEPTION 'certificate holder is required';
  END IF;

  v_language := nullif(btrim(coalesce(p_language, '')), '');
  IF v_language IS NOT NULL AND v_language NOT IN ('en', 'ar') THEN
    RAISE EXCEPTION 'invalid certificate language';
  END IF;

  v_old := nullif(btrim(coalesce(p_old_certificate_number, '')), '');

  IF p_enrollment_id IS NOT NULL THEN
    SELECT e.user_id, e.course_id
    INTO v_enroll_user, v_enroll_course
    FROM public.enrollments e
    WHERE e.id = p_enrollment_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'enrollment not found';
    END IF;

    IF p_profile_id IS DISTINCT FROM v_enroll_user THEN
      RAISE EXCEPTION 'enrollment does not match the student';
    END IF;

    IF p_course_id IS DISTINCT FROM v_enroll_course THEN
      RAISE EXCEPTION 'enrollment does not match the course';
    END IF;
  END IF;

  IF p_legacy_completion_id IS NOT NULL THEN
    SELECT
      lc.legacy_student_id,
      lc.course_id,
      lc.course_title_original,
      lc.old_certificate_number,
      lc.certificate_language
    INTO
      v_comp_student,
      v_comp_course,
      v_comp_title,
      v_comp_old,
      v_comp_language
    FROM public.legacy_course_completions lc
    WHERE lc.id = p_legacy_completion_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'completion not found';
    END IF;

    IF p_legacy_student_id IS DISTINCT FROM v_comp_student THEN
      RAISE EXCEPTION 'completion does not match the student';
    END IF;

    IF v_comp_course IS NOT NULL
       AND p_course_id IS DISTINCT FROM v_comp_course THEN
      RAISE EXCEPTION 'completion does not match the course';
    END IF;
  END IF;

  IF p_legacy_student_id IS NOT NULL THEN
    SELECT ls.full_name, ls.linked_profile_id
    INTO v_legacy_name, v_linked_profile
    FROM public.legacy_students ls
    WHERE ls.id = p_legacy_student_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'legacy student not found';
    END IF;
  END IF;

  IF p_profile_id IS NOT NULL AND p_legacy_student_id IS NOT NULL THEN
    IF v_linked_profile IS DISTINCT FROM p_profile_id THEN
      RAISE EXCEPTION 'legacy student is not linked to this profile';
    END IF;
  END IF;

  IF p_profile_id IS NOT NULL THEN
    SELECT p.first_name, p.last_name, p.locale
    INTO v_first, v_last, v_profile_locale
    FROM public.profiles p
    WHERE p.id = p_profile_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile not found';
    END IF;
  END IF;

  IF p_course_id IS NOT NULL THEN
    SELECT c.title_en, c.title_ar
    INTO v_course_en, v_course_ar
    FROM public.courses c
    WHERE c.id = p_course_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'course not found';
    END IF;
  END IF;

  IF p_legacy_completion_id IS NOT NULL THEN
    v_holder := btrim(coalesce(v_legacy_name, ''));
  ELSIF p_profile_id IS NOT NULL THEN
    v_holder := btrim(concat_ws(
      ' ',
      nullif(btrim(coalesce(v_first, '')), ''),
      nullif(btrim(coalesce(v_last, '')), '')
    ));
  ELSE
    v_holder := btrim(coalesce(v_legacy_name, ''));
  END IF;

  IF v_holder = '' THEN
    RAISE EXCEPTION 'certificate holder display name is required';
  END IF;

  IF p_course_id IS NOT NULL THEN
    v_title_en := coalesce(v_course_en, '');
    v_title_ar := coalesce(v_course_ar, '');
  ELSE
    v_title_en := '';
    v_title_ar := coalesce(v_comp_title, '');
  END IF;

  IF v_old IS NULL THEN
    v_old := nullif(btrim(coalesce(v_comp_old, '')), '');
  END IF;

  IF v_language IS NULL AND v_comp_language IN ('en', 'ar') THEN
    v_language := v_comp_language;
  ELSIF v_language IS NULL AND v_profile_locale IN ('en', 'ar') THEN
    v_language := v_profile_locale;
  END IF;

  IF p_legacy_completion_id IS NOT NULL THEN
    SELECT c.* INTO v_existing
    FROM public.certificates c
    WHERE c.legacy_completion_id = p_legacy_completion_id
    LIMIT 1;
  END IF;

  IF v_existing.id IS NULL
     AND p_profile_id IS NOT NULL
     AND p_course_id IS NOT NULL THEN
    SELECT c.* INTO v_existing
    FROM public.certificates c
    WHERE c.profile_id = p_profile_id
      AND c.course_id = p_course_id
    LIMIT 1;
  END IF;

  IF v_existing.id IS NULL
     AND p_legacy_student_id IS NOT NULL
     AND p_course_id IS NOT NULL THEN
    SELECT c.* INTO v_existing
    FROM public.certificates c
    WHERE c.legacy_student_id = p_legacy_student_id
      AND c.course_id = p_course_id
    LIMIT 1;
  END IF;

  IF v_existing.id IS NOT NULL THEN
    certificate_number := v_existing.certificate_number;
    already_existed := TRUE;
    status := v_existing.status;
    holder_display_name := v_existing.holder_display_name;
    course_title_en := v_existing.course_title_en;
    course_title_ar := v_existing.course_title_ar;
    issued_at := v_existing.issued_at;
    RETURN NEXT;
    RETURN;
  END IF;

  BEGIN
    v_number := public.next_certificate_number(v_year);

    INSERT INTO public.certificates (
      certificate_number,
      status,
      issued_at,
      course_id,
      profile_id,
      legacy_student_id,
      enrollment_id,
      legacy_completion_id,
      old_certificate_number,
      language,
      holder_display_name,
      course_title_ar,
      course_title_en,
      issued_by
    )
    VALUES (
      v_number,
      'issued',
      p_issued_at,
      p_course_id,
      p_profile_id,
      p_legacy_student_id,
      p_enrollment_id,
      p_legacy_completion_id,
      v_old,
      v_language,
      v_holder,
      v_title_ar,
      v_title_en,
      auth.uid()
    )
    RETURNING * INTO v_inserted;
  EXCEPTION
    WHEN unique_violation THEN
      v_inserted := NULL;
      IF p_legacy_completion_id IS NOT NULL THEN
        SELECT c.* INTO v_existing
        FROM public.certificates c
        WHERE c.legacy_completion_id = p_legacy_completion_id
        LIMIT 1;
      END IF;
      IF v_existing.id IS NULL
         AND p_profile_id IS NOT NULL
         AND p_course_id IS NOT NULL THEN
        SELECT c.* INTO v_existing
        FROM public.certificates c
        WHERE c.profile_id = p_profile_id
          AND c.course_id = p_course_id
        LIMIT 1;
      END IF;
      IF v_existing.id IS NULL
         AND p_legacy_student_id IS NOT NULL
         AND p_course_id IS NOT NULL THEN
        SELECT c.* INTO v_existing
        FROM public.certificates c
        WHERE c.legacy_student_id = p_legacy_student_id
          AND c.course_id = p_course_id
        LIMIT 1;
      END IF;
      IF v_existing.id IS NULL THEN
        RAISE EXCEPTION 'certificate already exists';
      END IF;
      certificate_number := v_existing.certificate_number;
      already_existed := TRUE;
      status := v_existing.status;
      holder_display_name := v_existing.holder_display_name;
      course_title_en := v_existing.course_title_en;
      course_title_ar := v_existing.course_title_ar;
      issued_at := v_existing.issued_at;
      RETURN NEXT;
      RETURN;
  END;

  certificate_number := v_inserted.certificate_number;
  already_existed := FALSE;
  status := v_inserted.status;
  holder_display_name := v_inserted.holder_display_name;
  course_title_en := v_inserted.course_title_en;
  course_title_ar := v_inserted.course_title_ar;
  issued_at := v_inserted.issued_at;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT
) IS
  'Admin-only atomic certificate issuance. Rebuilds holder/course snapshots from live rows. Allocates AVT-YYYY-XXXXXX from issued_at and inserts in one transaction. Does not accept a client certificate_number. Does not revoke.';

REVOKE ALL ON FUNCTION public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT
) FROM anon;
GRANT EXECUTE ON FUNCTION public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(
  DATE, UUID, UUID, UUID, UUID, UUID, TEXT, TEXT
) TO service_role;
