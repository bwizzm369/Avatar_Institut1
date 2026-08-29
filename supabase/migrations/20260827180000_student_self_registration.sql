-- Avatar Institut — Student self-registration profile fields
-- Idempotent. Apply manually in a Supabase project when ready.
-- Do not run remotely from this repository without explicit approval.
-- Does not create Student Pass rows, enrollments, or certificates.

-- ---------------------------------------------------------------------------
-- profiles — contact + declared study history (birth data omitted)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS previously_studied BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS previous_course TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS declared_certificate_number TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legacy_match_status TEXT NOT NULL DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_legacy_match_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_legacy_match_status_check
      CHECK (
        legacy_match_status IN (
          'none',
          'linked',
          'pending_review',
          'unmatched'
        )
      );
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.phone IS
  'Student WhatsApp / phone as free text. Not used for entitlement.';

COMMENT ON COLUMN public.profiles.country IS
  'Declared country of residence. Free text.';

COMMENT ON COLUMN public.profiles.previously_studied IS
  'Student declaration that they previously studied at Avatar Institut.';

COMMENT ON COLUMN public.profiles.previous_course IS
  'Declared previous formation. Not proof of enrollment.';

COMMENT ON COLUMN public.profiles.declared_certificate_number IS
  'Optional certificate number typed at signup. Never grants certificate ownership by itself.';

COMMENT ON COLUMN public.profiles.legacy_match_status IS
  'Server-only legacy matching outcome: none | linked | pending_review | unmatched. Never trusted from the client.';

-- ---------------------------------------------------------------------------
-- handle_new_user — copy only safe metadata. Never role / match status / pass.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_locale TEXT;
  v_previously_studied BOOLEAN;
BEGIN
  v_locale := COALESCE(NULLIF(btrim(meta ->> 'locale'), ''), 'en');
  IF v_locale NOT IN ('en', 'ar') THEN
    v_locale := 'en';
  END IF;

  v_previously_studied :=
    COALESCE(meta ->> 'previously_studied', '') IN ('true', 't', '1', 'yes');

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    locale,
    phone,
    country,
    previously_studied,
    previous_course,
    declared_certificate_number
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(btrim(meta ->> 'first_name'), ''),
    COALESCE(btrim(meta ->> 'last_name'), ''),
    v_locale,
    NULLIF(btrim(COALESCE(meta ->> 'phone', '')), ''),
    NULLIF(btrim(COALESCE(meta ->> 'country', '')), ''),
    v_previously_studied,
    CASE
      WHEN v_previously_studied THEN NULLIF(btrim(COALESCE(meta ->> 'previous_course', '')), '')
      ELSE NULL
    END,
    CASE
      WHEN v_previously_studied THEN NULLIF(btrim(COALESCE(meta ->> 'declared_certificate_number', '')), '')
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a student profile from Auth signup. Copies only first_name, last_name, locale, phone, country, previously_studied, previous_course, declared_certificate_number. Never copies role, legacy_match_status, linked_profile_id, Student Pass, payment, enrollment, or certificate ownership. Role stays at SQL default student.';

-- ---------------------------------------------------------------------------
-- Block student UPDATE of privileged profile columns (role + match fields)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.legacy_match_status IS DISTINCT FROM OLD.legacy_match_status
     OR NEW.previously_studied IS DISTINCT FROM OLD.previously_studied
     OR NEW.previous_course IS DISTINCT FROM OLD.previous_course
     OR NEW.declared_certificate_number IS DISTINCT FROM OLD.declared_certificate_number
  THEN
    IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
      RAISE EXCEPTION 'profiles privileged columns can only be changed by the service role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_role() IS
  'Students may update contact fields on their own row. role, legacy_match_status, and declared study-history columns require the service role.';
