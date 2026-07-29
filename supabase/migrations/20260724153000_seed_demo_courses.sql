-- Avatar Institut — seed demo courses (local migration only)
-- Idempotent upsert by slug. Prices and slugs match src/lib/courses.ts.
-- Do not run remotely without explicit approval.

INSERT INTO public.courses (
  id,
  slug,
  title_en,
  title_ar,
  summary_en,
  summary_ar,
  description_en,
  description_ar,
  price_cents,
  currency,
  duration_weeks,
  level_en,
  level_ar,
  is_demo,
  is_published
)
VALUES
  (
    'a1111111-1111-4111-8111-111111111111',
    'foundations-of-metaphysics',
    'Foundations of Metaphysics',
    'أسس الميتافيزيقا',
    'An introduction to metaphysical philosophy across Eastern and Western traditions. Demonstration course.',
    'مقدمة في الفلسفة الميتافيزيقية عبر التقاليد الشرقية والغربية. دورة تجريبية.',
    'This demonstration programme explores ontology, epistemology, and the nature of existence. Content is sample material for platform testing only — not an active enrollment offering.',
    'يستكشف هذا البرنامج التجريبي الأنطولوجيا ونظرية المعرفة وطبيعة الوجود. المحتوى نموذجي لاختبار المنصة فقط — وليس عرض تسجيل فعلي.',
    9900,
    'EUR',
    8,
    'Beginner',
    'مبتدئ',
    true,
    true
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'consciousness-exploration',
    'Consciousness Exploration',
    'استكشاف الوعي',
    'Investigation into awareness, meditation, and consciousness science. Demonstration course.',
    'بحث في الإدراك والتأمل وعلوم الوعي. دورة تجريبية.',
    'A demonstration curriculum covering neuroscience perspectives, contemplative practice, and self-inquiry. Sample content only.',
    'منهج تجريبي يغطي منظورات علم الأعصاب والممارسة التأملية والاستقصاء الذاتي. محتوى نموذجي فقط.',
    14900,
    'EUR',
    12,
    'Intermediate',
    'متوسط',
    true,
    true
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    'sacred-symbolism',
    'Sacred Symbolism',
    'الرمزية المقدسة',
    'Cross-cultural symbols and their spiritual significance. Demonstration course.',
    'رموز عبر الثقافات ودلالاتها الروحية. دورة تجريبية.',
    'Explore universal symbolic languages found across cultures. This is demonstration material for the catalogue and cart flows — not a live programme.',
    'استكشف لغات رمزية عالمية عبر الثقافات. هذه مادة تجريبية لتدفقات الكتالوج والسلة — وليست برنامجًا حيًا.',
    7900,
    'EUR',
    6,
    'Beginner',
    'مبتدئ',
    true,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title_en = EXCLUDED.title_en,
  title_ar = EXCLUDED.title_ar,
  summary_en = EXCLUDED.summary_en,
  summary_ar = EXCLUDED.summary_ar,
  description_en = EXCLUDED.description_en,
  description_ar = EXCLUDED.description_ar,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  duration_weeks = EXCLUDED.duration_weeks,
  level_en = EXCLUDED.level_en,
  level_ar = EXCLUDED.level_ar,
  is_demo = EXCLUDED.is_demo,
  is_published = EXCLUDED.is_published,
  updated_at = timezone('utc', now());
