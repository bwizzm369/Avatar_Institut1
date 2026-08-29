-- Avatar Institut — Consultation / Information requests + public reviews
-- Idempotent. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.
-- Independent lot: public requests and testimonials only.

-- ---------------------------------------------------------------------------
-- consultation_requests (PII — admin-only read)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ar')),
  request_type TEXT NOT NULL CHECK (request_type IN ('consultation', 'information')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_review', 'contacted', 'closed')),
  admin_notes TEXT NOT NULL DEFAULT '',
  consent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT consultation_requests_full_name_len
    CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 120),
  CONSTRAINT consultation_requests_email_len
    CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT consultation_requests_phone_len
    CHECK (char_length(phone) <= 40),
  CONSTRAINT consultation_requests_message_len
    CHECK (char_length(btrim(message)) BETWEEN 1 AND 4000),
  CONSTRAINT consultation_requests_admin_notes_len
    CHECK (char_length(admin_notes) <= 4000)
);

CREATE INDEX IF NOT EXISTS consultation_requests_created_at_idx
  ON public.consultation_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS consultation_requests_status_idx
  ON public.consultation_requests (status, created_at DESC);

DROP TRIGGER IF EXISTS consultation_requests_set_updated_at ON public.consultation_requests;
CREATE TRIGGER consultation_requests_set_updated_at
  BEFORE UPDATE ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Never trust client-supplied status / admin_notes on insert.
CREATE OR REPLACE FUNCTION public.prepare_consultation_request_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.status := 'new';
  NEW.admin_notes := '';
  NEW.email := lower(btrim(NEW.email));
  NEW.full_name := btrim(NEW.full_name);
  NEW.phone := btrim(COALESCE(NEW.phone, ''));
  NEW.message := btrim(NEW.message);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consultation_requests_prepare_insert ON public.consultation_requests;
CREATE TRIGGER consultation_requests_prepare_insert
  BEFORE INSERT ON public.consultation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_consultation_request_insert();

COMMENT ON TABLE public.consultation_requests IS
  'Public Consultation/Information requests. PII is admin-only. Browser cannot set status or admin_notes.';

-- ---------------------------------------------------------------------------
-- reviews (admin-managed testimonials; public reads published rows only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_title_en TEXT NOT NULL DEFAULT '',
  author_title_ar TEXT NOT NULL DEFAULT '',
  quote_en TEXT NOT NULL DEFAULT '',
  quote_ar TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT reviews_author_name_len
    CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 120),
  CONSTRAINT reviews_author_title_en_len CHECK (char_length(author_title_en) <= 160),
  CONSTRAINT reviews_author_title_ar_len CHECK (char_length(author_title_ar) <= 160),
  CONSTRAINT reviews_quote_en_len CHECK (char_length(quote_en) <= 2000),
  CONSTRAINT reviews_quote_ar_len CHECK (char_length(quote_ar) <= 2000),
  CONSTRAINT reviews_quote_present
    CHECK (char_length(btrim(quote_en)) > 0 OR char_length(btrim(quote_ar)) > 0)
);

CREATE INDEX IF NOT EXISTS reviews_published_sort_idx
  ON public.reviews (sort_order ASC, created_at DESC)
  WHERE is_published = true;

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.reviews IS
  'Admin-authored testimonials. Public SELECT is limited to is_published = true. No public writes.';

-- ---------------------------------------------------------------------------
-- Grants (RLS still required)
-- ---------------------------------------------------------------------------

GRANT INSERT ON public.consultation_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.consultation_requests TO authenticated;

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultation_requests_insert_public" ON public.consultation_requests;
CREATE POLICY "consultation_requests_insert_public"
  ON public.consultation_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND admin_notes = ''
    AND request_type IN ('consultation', 'information')
    AND locale IN ('en', 'ar')
  );

DROP POLICY IF EXISTS "consultation_requests_select_admin" ON public.consultation_requests;
CREATE POLICY "consultation_requests_select_admin"
  ON public.consultation_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "consultation_requests_update_admin" ON public.consultation_requests;
CREATE POLICY "consultation_requests_update_admin"
  ON public.consultation_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "consultation_requests_delete_admin" ON public.consultation_requests;
CREATE POLICY "consultation_requests_delete_admin"
  ON public.consultation_requests
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "reviews_select_published" ON public.reviews;
CREATE POLICY "reviews_select_published"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "reviews_select_admin" ON public.reviews;
CREATE POLICY "reviews_select_admin"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

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
