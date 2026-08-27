-- Avatar Institut — Admin Lot 3A: Student Pass subscriptions (socle)
-- Idempotent migration. Apply manually in Supabase when ready.
-- Do not run remotely from this repository without explicit approval.
-- Stripe billing is NOT wired here; stripe_* columns are placeholders only.

-- ---------------------------------------------------------------------------
-- student_pass_subscriptions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.student_pass_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  source TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT student_pass_subscriptions_status_check
    CHECK (status IN ('active', 'inactive', 'cancelled', 'expired'))
);

-- Unique profile_id (idempotent if table already existed without the constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'student_pass_subscriptions_profile_id_key'
      AND conrelid = 'public.student_pass_subscriptions'::regclass
  ) THEN
    ALTER TABLE public.student_pass_subscriptions
      ADD CONSTRAINT student_pass_subscriptions_profile_id_key UNIQUE (profile_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS student_pass_subscriptions_status_idx
  ON public.student_pass_subscriptions (status);

CREATE INDEX IF NOT EXISTS student_pass_subscriptions_expires_at_idx
  ON public.student_pass_subscriptions (expires_at)
  WHERE expires_at IS NOT NULL;

DROP TRIGGER IF EXISTS student_pass_subscriptions_set_updated_at
  ON public.student_pass_subscriptions;
CREATE TRIGGER student_pass_subscriptions_set_updated_at
  BEFORE UPDATE ON public.student_pass_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.student_pass_subscriptions IS
  'Student Pass (12 EUR/month) subscription state. Manual/offline activation supported; Stripe fields reserved for later.';

COMMENT ON COLUMN public.student_pass_subscriptions.source IS
  'Origin of the subscription row, e.g. manual, offline, stripe (stripe not wired yet).';

-- ---------------------------------------------------------------------------
-- has_active_student_pass(profile_id) — server-reusable entitlement check
-- True only when status = active AND (expires_at IS NULL OR expires_at > now()).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.has_active_student_pass(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Caller may only check own profile, unless admin or service role (same JWT pattern as protect_profile_role).
  IF NOT (
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
    OR public.is_admin()
    OR p_profile_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.student_pass_subscriptions s
    WHERE s.profile_id = p_profile_id
      AND s.status = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_student_pass(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_student_pass(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_student_pass(UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- RLS — admin read/write; student SELECT own only; no anon
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_pass_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_pass_select_admin"
  ON public.student_pass_subscriptions;
CREATE POLICY "student_pass_select_admin"
  ON public.student_pass_subscriptions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "student_pass_insert_admin"
  ON public.student_pass_subscriptions;
CREATE POLICY "student_pass_insert_admin"
  ON public.student_pass_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "student_pass_update_admin"
  ON public.student_pass_subscriptions;
CREATE POLICY "student_pass_update_admin"
  ON public.student_pass_subscriptions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "student_pass_select_own"
  ON public.student_pass_subscriptions;
CREATE POLICY "student_pass_select_own"
  ON public.student_pass_subscriptions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Intentionally no INSERT / UPDATE / DELETE for students or anon.
-- Students may only SELECT their own row. Mutations are admin-only (or service role).
