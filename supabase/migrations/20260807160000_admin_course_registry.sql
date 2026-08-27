-- Avatar Institut — Admin Lot 2B: course registry fields
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.

-- ---------------------------------------------------------------------------
-- New registry columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS student_pass_included BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS legacy_only BOOLEAN NOT NULL DEFAULT false;

-- English title remains present for existing code, but may be empty (optional copy).
ALTER TABLE public.courses
  ALTER COLUMN title_en SET DEFAULT '';

-- Price is optional until the academy sets a commercial price.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'courses'
      AND column_name = 'price_cents'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.courses ALTER COLUMN price_cents DROP NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.courses.image_url IS 'Optional public image URL for the course card.';
COMMENT ON COLUMN public.courses.is_for_sale IS 'When true, course may be sold individually (catalog/checkout later).';
COMMENT ON COLUMN public.courses.student_pass_included IS 'When true, course is included in Student Pass (billing later).';
COMMENT ON COLUMN public.courses.legacy_only IS 'Historical academy course — not necessarily offered for new sales.';
COMMENT ON COLUMN public.courses.price_cents IS 'Nullable until a price is defined. Amount in minor units.';

CREATE INDEX IF NOT EXISTS courses_title_ar_lower_idx
  ON public.courses (lower(title_ar));

CREATE INDEX IF NOT EXISTS courses_for_sale_idx
  ON public.courses (is_for_sale)
  WHERE is_for_sale = true;

CREATE INDEX IF NOT EXISTS courses_legacy_only_idx
  ON public.courses (legacy_only)
  WHERE legacy_only = true;

-- ---------------------------------------------------------------------------
-- Admin write access (reads already covered by courses_select_admin)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;
CREATE POLICY "courses_insert_admin"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "courses_update_admin" ON public.courses;
CREATE POLICY "courses_update_admin"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
