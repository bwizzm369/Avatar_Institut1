/**
 * Stable UUIDs for demo courses in Supabase.
 * Must match supabase/migrations/*_seed_demo_courses.sql exactly.
 */
export const DEMO_COURSE_DB_IDS = {
  "foundations-of-metaphysics": "a1111111-1111-4111-8111-111111111111",
  "consciousness-exploration": "a2222222-2222-4222-8222-222222222222",
  "sacred-symbolism": "a3333333-3333-4333-8333-333333333333",
} as const;

export type DemoCourseSlug = keyof typeof DEMO_COURSE_DB_IDS;

export function isDemoCourseSlug(slug: string): slug is DemoCourseSlug {
  return Object.prototype.hasOwnProperty.call(DEMO_COURSE_DB_IDS, slug);
}

export function getDemoCourseDbId(slug: DemoCourseSlug): string {
  return DEMO_COURSE_DB_IDS[slug];
}
