-- Avatar Institut — Admin Lot 2: legacy students + historical course completions
-- Idempotent migration. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.

-- ---------------------------------------------------------------------------
-- legacy_students — historical registry (no auth.users required)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.legacy_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  linked_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT legacy_students_email_lower_chk
    CHECK (email IS NULL OR email = lower(email))
);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_students_email_unique_idx
  ON public.legacy_students (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS legacy_students_full_name_idx
  ON public.legacy_students (lower(full_name));

CREATE INDEX IF NOT EXISTS legacy_students_linked_profile_idx
  ON public.legacy_students (linked_profile_id)
  WHERE linked_profile_id IS NOT NULL;

DROP TRIGGER IF EXISTS legacy_students_set_updated_at ON public.legacy_students;
CREATE TRIGGER legacy_students_set_updated_at
  BEFORE UPDATE ON public.legacy_students
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.legacy_students IS
  'Historical / pre-Auth student registry. Phone and notes are admin-private. Do not expose publicly.';

-- ---------------------------------------------------------------------------
-- legacy_course_completions — historical course finishes (certificates later)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.legacy_course_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_student_id UUID NOT NULL REFERENCES public.legacy_students (id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses (id) ON DELETE SET NULL,
  course_title_original TEXT NOT NULL,
  completed_at DATE NOT NULL,
  old_certificate_number TEXT,
  certificate_language TEXT
    CHECK (
      certificate_language IS NULL
      OR certificate_language IN ('en', 'ar')
    ),
  import_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS legacy_course_completions_fingerprint_uidx
  ON public.legacy_course_completions (import_fingerprint);

CREATE INDEX IF NOT EXISTS legacy_course_completions_student_idx
  ON public.legacy_course_completions (legacy_student_id);

CREATE INDEX IF NOT EXISTS legacy_course_completions_course_idx
  ON public.legacy_course_completions (course_id)
  WHERE course_id IS NOT NULL;

COMMENT ON TABLE public.legacy_course_completions IS
  'Historical course completions for legacy students. Used later for certificates. Idempotent via import_fingerprint.';

-- ---------------------------------------------------------------------------
-- RLS — admin only (via public.is_admin())
-- ---------------------------------------------------------------------------

ALTER TABLE public.legacy_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_course_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "legacy_students_select_admin" ON public.legacy_students;
CREATE POLICY "legacy_students_select_admin"
  ON public.legacy_students
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "legacy_students_insert_admin" ON public.legacy_students;
CREATE POLICY "legacy_students_insert_admin"
  ON public.legacy_students
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "legacy_students_update_admin" ON public.legacy_students;
CREATE POLICY "legacy_students_update_admin"
  ON public.legacy_students
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "legacy_completions_select_admin" ON public.legacy_course_completions;
CREATE POLICY "legacy_completions_select_admin"
  ON public.legacy_course_completions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "legacy_completions_insert_admin" ON public.legacy_course_completions;
CREATE POLICY "legacy_completions_insert_admin"
  ON public.legacy_course_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- No public / anon access. No student self-read of phone/notes.
