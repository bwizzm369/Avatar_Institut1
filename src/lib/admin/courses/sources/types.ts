/**
 * Source adapters for course imports.
 * Excel/CSV are required now; Google Sheets can plug in later without
 * rewriting preview/validation/commit.
 */

import type { CourseSourceRow } from "@/lib/admin/courses/types";

export type CourseImportSourceResult =
  | {
      ok: true;
      sourceLabel: string;
      rows: CourseSourceRow[];
    }
  | {
      ok: false;
      sourceLabel: string;
      errors: string[];
    };

export type CourseImportSource = {
  /** Short identifier, e.g. "excel-csv" or future "google-sheets". */
  kind: string;
  load: () => Promise<CourseImportSourceResult> | CourseImportSourceResult;
};
