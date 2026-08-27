"use client";

import { useMemo, useState, useTransition } from "react";
import {
  confirmCoursesImportAction,
  previewCoursesImportAction,
} from "@/app/admin/(console)/courses/actions";
import type {
  CourseImportCommitResult,
  CoursePreviewReport,
} from "@/lib/admin/courses/types";
import { formatCentsForInput } from "@/lib/admin/courses/normalize";

function statusClass(status: string): string {
  switch (status) {
    case "READY":
      return "admin-status admin-status-ready";
    case "WARNING":
      return "admin-status admin-status-warning";
    case "ERROR":
      return "admin-status admin-status-error";
    case "DUPLICATE":
      return "admin-status admin-status-duplicate";
    default:
      return "admin-status";
  }
}

export function CoursesImportClient() {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<CoursePreviewReport | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<"ready_only" | "ready_and_warnings">(
    "ready_and_warnings",
  );
  const [result, setResult] = useState<CourseImportCommitResult | null>(null);

  const canConfirm = useMemo(() => {
    if (!report || report.parseErrors.length > 0) return false;
    if (mode === "ready_only") return report.readyCount > 0;
    return report.readyCount + report.warningCount > 0;
  }, [report, mode]);

  function onPreview(formData: FormData) {
    setFeedback(null);
    setResult(null);
    startTransition(async () => {
      const response = await previewCoursesImportAction(formData);
      if (!response.ok) {
        setFeedback(response.error);
        setReport(response.report ?? null);
        return;
      }
      setReport(response.report);
    });
  }

  function onConfirm() {
    if (!report) return;
    setFeedback(null);
    startTransition(async () => {
      const response = await confirmCoursesImportAction({
        rows: report.rows,
        mode,
      });
      if (!response.ok) {
        setFeedback(response.error);
        if (response.result) setResult(response.result);
        return;
      }
      setResult(response.result);
    });
  }

  return (
    <div className="admin-import">
      <section className="admin-panel">
        <div className="admin-import-actions">
          {/* File download endpoint — plain anchor is intentional. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/admin/courses/import/template" className="admin-btn-ghost">
            Download Courses Template
          </a>
        </div>
        <form className="admin-form admin-import-form" action={onPreview}>
          <div className="admin-field">
            <label htmlFor="courses-file">Upload Excel / CSV</label>
            <input
              id="courses-file"
              name="file"
              type="file"
              accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              required
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={pending}>
            {pending ? "Working…" : "Preview"}
          </button>
        </form>
        <p className="admin-placeholder">
          Preview never writes to the database. Confirm Import is required before
          any course is created.
        </p>
      </section>

      {feedback ? (
        <div className="admin-alert admin-alert-error" role="alert">
          {feedback}
        </div>
      ) : null}

      {report ? (
        <section className="admin-panel">
          <h2>Validation report</h2>
          <div className="admin-import-summary">
            <span>{report.totalRows} rows</span>
            <span>{report.readyCount} ready</span>
            <span>{report.warningCount} warnings</span>
            <span>{report.errorCount} errors</span>
            <span>{report.duplicateCount} duplicates</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Arabic title</th>
                  <th>English title</th>
                  <th>Price</th>
                  <th>Published</th>
                  <th>For sale</th>
                  <th>Student Pass</th>
                  <th>Historical</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td dir="rtl">{row.titleAr}</td>
                    <td>{row.titleEn || "—"}</td>
                    <td>
                      {row.priceCents == null
                        ? "—"
                        : `${formatCentsForInput(row.priceCents)} ${row.currency}`}
                    </td>
                    <td>{row.isPublished ? "Yes" : "No"}</td>
                    <td>{row.isForSale ? "Yes" : "No"}</td>
                    <td>{row.studentPassIncluded ? "Yes" : "No"}</td>
                    <td>{row.legacyOnly ? "Yes" : "No"}</td>
                    <td>
                      <span className={statusClass(row.status)}>{row.status}</span>
                      {row.messages.length > 0 ? (
                        <p className="admin-table-note">{row.messages.join(" ")}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-confirm-box">
            <h3>Confirm Import</h3>
            <fieldset className="admin-fieldset">
              <label className="admin-radio">
                <input
                  type="radio"
                  checked={mode === "ready_only"}
                  onChange={() => setMode("ready_only")}
                />
                Import READY rows only
              </label>
              <label className="admin-radio">
                <input
                  type="radio"
                  checked={mode === "ready_and_warnings"}
                  onChange={() => setMode("ready_and_warnings")}
                />
                Import READY + WARNING (e.g. auto-generated slug)
              </label>
            </fieldset>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={pending || !canConfirm}
              onClick={onConfirm}
            >
              {pending ? "Importing…" : "Confirm Import"}
            </button>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="admin-panel">
          <h2>Import result</h2>
          <ul className="admin-result-list">
            <li>Rows processed: {result.rowsProcessed}</li>
            <li>Courses created: {result.coursesCreated}</li>
            <li>Duplicates skipped: {result.duplicatesSkipped}</li>
            <li>Warnings imported: {result.warningsImported}</li>
            <li>Errors skipped: {result.errorsSkipped}</li>
          </ul>
        </section>
      ) : null}
    </div>
  );
}
