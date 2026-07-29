# Content import (Phase 3A Light)

Local CSV model for modules and lessons. **Do not run a remote import from this repository** unless explicitly approved.

## Template

File: `modules-lessons.template.csv`

| Column | Required | Notes |
|--------|----------|-------|
| `course_slug` | yes | Must match an existing `courses.slug` |
| `module_order` | yes | Integer ≥ 1; unique per course |
| `module_title_en` | yes | |
| `module_title_ar` | yes | |
| `lesson_order` | yes | Integer ≥ 1; unique per module |
| `lesson_title_en` | yes | |
| `lesson_title_ar` | yes | |
| `lesson_type` | yes | `video` \| `text` \| `pdf` |
| `duration_minutes` | yes | Integer ≥ 0 |
| `bunny_video_id` | no | Bunny Stream id placeholder — never expose without enrollment |
| `text_content_en` | no | Used when `lesson_type=text` |
| `text_content_ar` | no | Used when `lesson_type=text` |
| `pdf_url` | no | App-relative or HTTPS URL when `lesson_type=pdf` |
| `is_preview` | no | `true` / `false` (default `false`) |

## Example

`examples/foundations-of-metaphysics.csv` — demonstration curriculum for `foundations-of-metaphysics`.

The same content is seeded locally by migration:

`supabase/migrations/20260727150000_phase3a_content_reader.sql`

## Security

- Apply curriculum only via controlled admin/service workflows later.
- Never import with the browser anon key.
- Never publish `bunny_video_id` on unauthenticated pages.
- Student access still requires an **active** enrollment with `payment_confirmed_at` set.
