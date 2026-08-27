-- Avatar Institut — Per-course Student Pass discount %
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.

-- ---------------------------------------------------------------------------
-- Discount percent on courses (0–100). Ignored when student_pass_included.
-- ---------------------------------------------------------------------------

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS student_pass_discount_percent INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_student_pass_discount_percent_check'
      AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_student_pass_discount_percent_check
      CHECK (
        student_pass_discount_percent >= 0
        AND student_pass_discount_percent <= 100
      );
  END IF;
END $$;

COMMENT ON COLUMN public.courses.student_pass_discount_percent IS
  'Percent off list price for active Student Pass members when student_pass_included is false. 0–100. Ignored when included.';

-- ---------------------------------------------------------------------------
-- Learner access: active individual enrollment OR (active Pass + included).
-- Individual enrollments are never removed by this rule.
-- Extends content RLS helper — does not alter student_pass_subscriptions policies.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_actively_enrolled(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = p_course_id
        AND e.status = 'active'
        AND e.payment_confirmed_at IS NOT NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id = p_course_id
        AND c.student_pass_included = true
        AND public.has_active_student_pass(auth.uid())
    );
$$;
