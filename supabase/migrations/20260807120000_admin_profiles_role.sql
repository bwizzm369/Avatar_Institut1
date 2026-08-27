-- Avatar Institut — Admin roles (Lot 1)
-- Idempotent migration. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.

-- ---------------------------------------------------------------------------
-- profiles.role
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('student', 'admin'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.role IS
  'Application role. Only student|admin. Elevation must be done by service role / SQL — never by the browser.';

-- ---------------------------------------------------------------------------
-- Prevent self-escalation of role via profiles UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
      RAISE EXCEPTION 'profiles.role can only be changed by the service role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON public.profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- Helper: is current user an admin? (SECURITY DEFINER for RLS policies)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins may read all profiles (for back-office lists / counts).
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins may read all courses (including unpublished).
DROP POLICY IF EXISTS "courses_select_admin" ON public.courses;
CREATE POLICY "courses_select_admin"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
