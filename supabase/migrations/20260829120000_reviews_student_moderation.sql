-- Avatar Institut — Reviews Lot A: student submit + moderation
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.
-- No legacy testimonial mapping or data backfill.

-- ---------------------------------------------------------------------------
-- Columns (student fields nullable so admin-created rows stay valid)
-- ---------------------------------------------------------------------------

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rating SMALLINT,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

-- Publication invariant for any existing rows (not a legacy content migration).
UPDATE public.reviews
SET moderation_status = 'approved'
WHERE is_published = true
  AND moderation_status IS DISTINCT FROM 'approved';

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_rating_range,
  DROP CONSTRAINT IF EXISTS reviews_student_rating_required,
  DROP CONSTRAINT IF EXISTS reviews_moderation_status_allowed,
  DROP CONSTRAINT IF EXISTS reviews_publication_invariant;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_range
    CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_student_rating_required
    CHECK (profile_id IS NULL OR rating BETWEEN 1 AND 5),
  ADD CONSTRAINT reviews_moderation_status_allowed
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD CONSTRAINT reviews_publication_invariant
    CHECK (
      (moderation_status = 'approved' AND is_published = true)
      OR (moderation_status IN ('pending', 'rejected') AND is_published = false)
    );

COMMENT ON COLUMN public.reviews.profile_id IS
  'Student owner. NULL on admin-created testimonials. Must equal auth.uid() on student insert.';
COMMENT ON COLUMN public.reviews.rating IS
  'Required 1–5 when profile_id is set. Optional on admin-created testimonials.';
COMMENT ON COLUMN public.reviews.moderation_status IS
  'pending | approved | rejected. Student insert is always pending.';
COMMENT ON COLUMN public.reviews.reviewed_at IS
  'Set when an admin approves or rejects. Students cannot write this column.';
COMMENT ON COLUMN public.reviews.reviewed_by IS
  'Admin profile id. Students cannot write this column.';

-- One student review per profile. Admin testimonials (profile_id NULL) are unlimited.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_review_per_profile_idx
  ON public.reviews (profile_id)
  WHERE profile_id IS NOT NULL;

DROP INDEX IF EXISTS reviews_published_sort_idx;
CREATE INDEX IF NOT EXISTS reviews_public_approved_sort_idx
  ON public.reviews (sort_order ASC, created_at DESC)
  WHERE is_published = true AND moderation_status = 'approved';

CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx
  ON public.reviews (moderation_status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: student insert guarantees + admin publication invariant
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prepare_review_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF public.is_admin() THEN
      IF NEW.is_published THEN
        NEW.moderation_status := 'approved';
      ELSIF NEW.moderation_status = 'approved' THEN
        NEW.is_published := true;
      ELSE
        IF NEW.moderation_status IS NULL
          OR NEW.moderation_status NOT IN ('pending', 'rejected', 'approved') THEN
          NEW.moderation_status := 'pending';
        END IF;
        NEW.is_published := (NEW.moderation_status = 'approved');
      END IF;

      IF NEW.moderation_status IN ('approved', 'rejected') THEN
        IF NEW.reviewed_at IS NULL THEN
          NEW.reviewed_at := timezone('utc', now());
        END IF;
        IF NEW.reviewed_by IS NULL THEN
          NEW.reviewed_by := auth.uid();
        END IF;
      ELSE
        NEW.reviewed_at := NULL;
        NEW.reviewed_by := NULL;
      END IF;

      RETURN NEW;
    END IF;

    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'reviews_insert_requires_authenticated_profile';
    END IF;

    -- Student INSERT: own profile, pending, unpublished, no moderation metadata.
    NEW.profile_id := auth.uid();
    NEW.moderation_status := 'pending';
    NEW.is_published := false;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'reviews_update_admin_only';
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
    NEW.is_published := (NEW.moderation_status = 'approved');
  ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    IF NEW.is_published THEN
      NEW.moderation_status := 'approved';
    ELSIF OLD.moderation_status = 'approved' THEN
      NEW.moderation_status := 'pending';
    END IF;
  ELSE
    NEW.is_published := (NEW.moderation_status = 'approved');
  END IF;

  IF NEW.moderation_status IN ('approved', 'rejected') THEN
    IF NEW.reviewed_at IS NULL THEN
      NEW.reviewed_at := timezone('utc', now());
    END IF;
    IF NEW.reviewed_by IS NULL THEN
      NEW.reviewed_by := auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_prepare_write ON public.reviews;
CREATE TRIGGER reviews_prepare_write
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_review_write();

COMMENT ON FUNCTION public.prepare_review_write() IS
  'Students always insert pending unpublished reviews for auth.uid(). They cannot approve, reject, publish, or set reviewed_*. Admins keep approved=published and pending/rejected=unpublished.';

COMMENT ON TABLE public.reviews IS
  'Student-submitted reviews (pending until admin approval) and optional admin-created testimonials. Anon SELECT is approved+published only. Authenticated students may also SELECT their own row. No anonymous writes.';

-- ---------------------------------------------------------------------------
-- Grants (RLS still required). Anon must not insert.
-- ---------------------------------------------------------------------------

REVOKE INSERT, UPDATE, DELETE ON public.reviews FROM anon;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "reviews_select_published" ON public.reviews;
CREATE POLICY "reviews_select_published"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true AND moderation_status = 'approved');

DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "reviews_select_admin" ON public.reviews;
CREATE POLICY "reviews_select_admin"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "reviews_insert_student" ON public.reviews;
CREATE POLICY "reviews_insert_student"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT public.is_admin()
    AND profile_id = auth.uid()
    AND moderation_status = 'pending'
    AND is_published = false
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rating BETWEEN 1 AND 5
  );

DROP POLICY IF EXISTS "reviews_insert_admin" ON public.reviews;
CREATE POLICY "reviews_insert_admin"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_update_admin" ON public.reviews;
CREATE POLICY "reviews_update_admin"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;
CREATE POLICY "reviews_delete_admin"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
