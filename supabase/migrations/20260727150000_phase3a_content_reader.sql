-- Avatar Institut — Phase 3A Light: lesson content fields, progress RLS, demo curriculum
-- Local migration only. Idempotent. Do not run remotely without explicit approval.

-- ---------------------------------------------------------------------------
-- Lessons: content types + Bunny placeholder + text/PDF fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT 'video';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS text_content_en TEXT NOT NULL DEFAULT '';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS text_content_ar TEXT NOT NULL DEFAULT '';

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT false;

-- Ensure check constraint on lesson_type (drop/recreate for idempotency)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lessons_lesson_type_check'
      AND conrelid = 'public.lessons'::regclass
  ) THEN
    ALTER TABLE public.lessons DROP CONSTRAINT lessons_lesson_type_check;
  END IF;
END $$;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_lesson_type_check
  CHECK (lesson_type IN ('video', 'text', 'pdf'));

COMMENT ON COLUMN public.lessons.bunny_video_id IS
  'Bunny Stream video id reserved for a later phase. Never expose via public unauthenticated pages.';

COMMENT ON COLUMN public.lessons.lesson_type IS
  'Lesson media kind: video | text | pdf.';

-- ---------------------------------------------------------------------------
-- Lesson progress: enrolled students may write their own rows (RLS)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "lesson_progress_insert_own" ON public.lesson_progress;
CREATE POLICY "lesson_progress_insert_own"
  ON public.lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_actively_enrolled(public.lesson_course_id(lesson_id))
  );

DROP POLICY IF EXISTS "lesson_progress_update_own" ON public.lesson_progress;
CREATE POLICY "lesson_progress_update_own"
  ON public.lesson_progress
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_actively_enrolled(public.lesson_course_id(lesson_id))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_actively_enrolled(public.lesson_course_id(lesson_id))
  );

COMMENT ON TABLE public.lesson_progress IS
  'Students may SELECT/INSERT/UPDATE only their own progress rows, and only when actively enrolled in the lesson course. No DELETE from browser.';

-- ---------------------------------------------------------------------------
-- Demo curriculum seed — Foundations of Metaphysics (idempotent)
-- Stable UUIDs + ON CONFLICT (id) DO NOTHING:
-- never DELETE modules/lessons; never cascade-wipe lesson_progress;
-- re-runs create no duplicates; existing/manual rows are left untouched.
-- ---------------------------------------------------------------------------

INSERT INTO public.course_modules (id, course_id, title_en, title_ar, sort_order)
VALUES
  (
    'b1111111-1111-4111-8111-111111111101',
    'a1111111-1111-4111-8111-111111111111',
    'Module 1 — First Principles',
    'الوحدة 1 — المبادئ الأولى',
    1
  ),
  (
    'b1111111-1111-4111-8111-111111111102',
    'a1111111-1111-4111-8111-111111111111',
    'Module 2 — Ways of Knowing',
    'الوحدة 2 — سبل المعرفة',
    2
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lessons (
  id,
  module_id,
  title_en,
  title_ar,
  duration_minutes,
  sort_order,
  lesson_type,
  bunny_video_id,
  text_content_en,
  text_content_ar,
  pdf_url,
  is_preview
)
VALUES
  (
    'c1111111-1111-4111-8111-111111111101',
    'b1111111-1111-4111-8111-111111111101',
    'Welcome and orientation',
    'ترحيب وتوجيه',
    8,
    1,
    'video',
    'demo-bunny-foundations-welcome',
    '',
    '',
    NULL,
    true
  ),
  (
    'c1111111-1111-4111-8111-111111111102',
    'b1111111-1111-4111-8111-111111111101',
    'What is metaphysics?',
    'ما هي الميتافيزيقا؟',
    12,
    2,
    'text',
    NULL,
    'Metaphysics asks what reality is made of and how existence relates to mind. This demonstration text is sample material for the student reader — not a live programme.',
    'تسأل الميتافيزيقا عمّا تتكوّن منه الحقيقة وكيف يرتبط الوجود بالعقل. هذا النص التجريبي مادة نموذجية لقارئ الطالب — وليس برنامجًا حيًا.',
    NULL,
    false
  ),
  (
    'c1111111-1111-4111-8111-111111111103',
    'b1111111-1111-4111-8111-111111111101',
    'Reading guide (PDF)',
    'دليل القراءة (PDF)',
    5,
    3,
    'pdf',
    NULL,
    '',
    '',
    '/content/demo/foundations-reading-guide.pdf',
    false
  ),
  (
    'c1111111-1111-4111-8111-111111111201',
    'b1111111-1111-4111-8111-111111111102',
    'Contemplative attention',
    'الانتباه التأملي',
    15,
    1,
    'video',
    'demo-bunny-foundations-attention',
    '',
    '',
    NULL,
    false
  ),
  (
    'c1111111-1111-4111-8111-111111111202',
    'b1111111-1111-4111-8111-111111111102',
    'Journal prompts',
    'محفزات دفتر التأمل',
    10,
    2,
    'text',
    NULL,
    'Write for ten minutes on a moment when your sense of self felt wider than your thoughts. Demonstration prompt only.',
    'اكتب لمدة عشر دقائق عن لحظة بدا فيها إحساسك بالذات أوسع من أفكارك. محفز تجريبي فقط.',
    NULL,
    false
  )
ON CONFLICT (id) DO NOTHING;
