-- Avatar Institut — Supabase Light (local migration only)
-- Apply manually in a Supabase project when ready.
-- Do not run remotely from this repository without explicit approval.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ar')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX profiles_email_idx ON public.profiles (email);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'locale', ''), 'en')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  summary_en TEXT NOT NULL DEFAULT '',
  summary_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'CHF')),
  duration_weeks INTEGER NOT NULL DEFAULT 1 CHECK (duration_weeks > 0),
  level_en TEXT NOT NULL DEFAULT '',
  level_ar TEXT NOT NULL DEFAULT '',
  is_demo BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX courses_published_idx ON public.courses (is_published) WHERE is_published = true;
CREATE INDEX courses_slug_idx ON public.courses (slug);

CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Course modules
-- ---------------------------------------------------------------------------

CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (course_id, sort_order)
);

CREATE INDEX course_modules_course_id_idx ON public.course_modules (course_id);

CREATE TRIGGER course_modules_set_updated_at
  BEFORE UPDATE ON public.course_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lessons
-- ---------------------------------------------------------------------------

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules (id) ON DELETE CASCADE,
  title_en TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Bunny Stream id reserved for a later phase (no public permanent links).
  bunny_video_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (module_id, sort_order)
);

CREATE INDEX lessons_module_id_idx ON public.lessons (module_id);

CREATE TRIGGER lessons_set_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Enrollments
-- Access is granted only server-side after payment confirmation or manual
-- validation. Browser clients must never INSERT enrollments.
-- ---------------------------------------------------------------------------

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'active', 'completed', 'revoked')),
  enrolled_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, course_id)
);

CREATE INDEX enrollments_user_id_idx ON public.enrollments (user_id);
CREATE INDEX enrollments_course_id_idx ON public.enrollments (course_id);
CREATE INDEX enrollments_active_idx ON public.enrollments (user_id, status)
  WHERE status = 'active';

CREATE TRIGGER enrollments_set_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Lesson progress
-- ---------------------------------------------------------------------------

CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons (id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  last_position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX lesson_progress_user_id_idx ON public.lesson_progress (user_id);
CREATE INDEX lesson_progress_lesson_id_idx ON public.lesson_progress (lesson_id);

CREATE TRIGGER lesson_progress_set_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers for enrollment-gated content
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_actively_enrolled(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = p_course_id
      AND e.status = 'active'
      AND e.payment_confirmed_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.lesson_course_id(p_lesson_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cm.course_id
  FROM public.lessons l
  JOIN public.course_modules cm ON cm.id = l.module_id
  WHERE l.id = p_lesson_id;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: student reads and updates only own row
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No client INSERT/DELETE on profiles (created by trigger / service role)

-- Courses: published courses are publicly readable
CREATE POLICY "courses_select_published"
  ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- No client writes on courses

-- Modules & lessons: only actively enrolled students (payment confirmed)
CREATE POLICY "course_modules_select_enrolled"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (public.is_actively_enrolled(course_id));

CREATE POLICY "lessons_select_enrolled"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    public.is_actively_enrolled(
      (SELECT cm.course_id FROM public.course_modules cm WHERE cm.id = module_id)
    )
  );

-- Enrollments: students may SELECT own rows only
CREATE POLICY "enrollments_select_own"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Intentionally no INSERT / UPDATE / DELETE policies for enrollments.
-- Access is granted only via service role after payment confirmation or
-- manual validation on the server — never from the browser.

-- Lesson progress: students may SELECT own rows only in this phase
CREATE POLICY "lesson_progress_select_own"
  ON public.lesson_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No client INSERT/UPDATE/DELETE on lesson_progress in this phase
-- (progress writes will be server-mediated in a later phase).

COMMENT ON TABLE public.enrollments IS
  'Enrollments must be created only by server (service role) after confirmed payment or manual validation. No browser INSERT.';
