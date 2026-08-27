"use client";

import { useMemo, useState, useTransition } from "react";
import {
  confirmImportAction,
  previewImportAction,
} from "@/app/admin/(console)/import/actions";
import type {
  ConfirmImportMode,
  ImportCommitResult,
  ImportRowStatus,
  PreviewReport,
} from "@/lib/admin/import/types";

function displayStatus(status: ImportRowStatus): string {
  switch (status) {
    case "READY":
    case "WARNING":
      return "Ready";
    case "EXISTING":
    case "DUPLICATE":
      return "Existing";
    case "INVALID":
      return "Invalid";
    default:
      return status;
  }
}

function statusClass(status: ImportRowStatus): string {
  switch (status) {
    case "READY":
      return "admin-status admin-status-ready";
    case "WARNING":
      return "admin-status admin-status-warning";
    case "INVALID":
      return "admin-status admin-status-error";
    case "EXISTING":
    case "DUPLICATE":
      return "admin-status admin-status-duplicate";
    default:
      return "admin-status";
  }
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportClient() {
  const [pending, startTransition] = useTransition();
  const [report, setReport] = useState<PreviewReport | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<ConfirmImportMode>("ready_only");
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  const [errorCsv, setErrorCsv] = useState<string>("");

  const canConfirm = useMemo(() => {
    if (!report || report.parseErrors.length > 0) return false;
    if (mode === "ready_only") return report.readyCount > 0;
    return report.readyCount + report.warningCount > 0;
  }, [report, mode]);

  function onPreview(formData: FormData) {
    setFeedback(null);
    setResult(null);
    setErrorCsv("");
    startTransition(async () => {
      const response = await previewImportAction(formData);
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
      const response = await confirmImportAction({
        rows: report.rows,
        mode,
      });
      if (!response.ok) {
        setFeedback(response.error);
        if (response.result) setResult(response.result);
        if (response.errorCsv) setErrorCsv(response.errorCsv);
        return;
      }
      setResult(response.result);
      setErrorCsv(response.errorCsv);
      setFeedback(null);
    });
  }

  return (
    <div className="admin-import">
      <section className="admin-panel admin-import-upload">
        <div className="admin-import-actions">
          <a href="/admin/import/template" className="admin-btn-ghost">
            Download Excel Template
          </a>
        </div>

        <form
          className="admin-form admin-import-form"
          action={onPreview}
          encType="multipart/form-data"
        >
          <div className="admin-field">
            <label htmlFor="import-file">Upload Excel / CSV</label>
            <input
              id="import-file"
              name="file"
              type="file"
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              required
            />
          </div>
          <button type="submit" className="admin-btn-primary" disabled={pending}>
            {pending ? "Working…" : "Preview"}
          </button>
        </form>
        <p className="admin-placeholder">
          Columns: full_name, email, phone, notes (optional: course,
          certificate_number, completion_date). Preview never writes to the
          database. Confirm Import is required before any historical data is
          saved. Does not create Auth accounts, Student Pass, or certificates.
        </p>
      </section>

      {feedback ? (
        <div className="admin-alert admin-alert-error" role="alert">
          {feedback}
        </div>
      ) : null}

      {report ? (
        <section className="admin-panel" aria-label="Validation report">
          <h2>Validation report</h2>
          <div className="admin-import-summary">
            <span>{report.totalRows} rows</span>
            <span>{report.readyCount} ready</span>
            <span>{report.existingCount} existing</span>
            <span>{report.invalidCount} invalid</span>
            {report.warningCount > 0 ? (
              <span>{report.warningCount} warnings</span>
            ) : null}
          </div>

          {report.parseErrors.length > 0 ? (
            <ul className="admin-import-parse-errors">
              {report.parseErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Notes / Error</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td>{row.studentName}</td>
                    <td>{row.studentEmail ?? "—"}</td>
                    <td>{row.studentPhone ?? "—"}</td>
                    <td>
                      <span className={statusClass(row.status)}>
                        {displayStatus(row.status)}
                      </span>
                    </td>
                    <td>
                      {row.messages.length > 0
                        ? row.messages.join(" ")
                        : (row.notes ?? "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-confirm-box">
            <h3>Confirm Import</h3>
            <p>
              {report.readyCount} ready · {report.existingCount} existing ·{" "}
              {report.invalidCount} invalid
              {report.warningCount > 0
                ? ` · ${report.warningCount} warnings`
                : ""}
            </p>
            <p className="admin-placeholder">
              Invalid and Existing rows are never imported as new students.
              Ready rows may attach a new historical completion to an existing
              email. Optional course warnings can be included below.
            </p>
            <fieldset className="admin-fieldset">
              <legend className="visually-hidden">Warning handling</legend>
              <label className="admin-radio">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "ready_only"}
                  onChange={() => setMode("ready_only")}
                />
                Import Ready rows only (skip course warnings)
              </label>
              <label className="admin-radio">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "ready_and_warnings"}
                  onChange={() => setMode("ready_and_warnings")}
                />
                Import Ready + course warnings (store original course title)
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
        <section className="admin-panel" aria-label="Import result">
          <h2>Import result</h2>
          <ul className="admin-result-list">
            <li>Imported: {result.imported}</li>
            <li>Existing: {result.existing}</li>
            <li>Invalid: {result.invalid}</li>
            <li>Course completions created: {result.courseCompletionsCreated}</li>
          </ul>
          {errorCsv.trim().length > 0 && result.errorRows.length > 0 ? (
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() =>
                downloadTextFile(
                  "import-errors.csv",
                  errorCsv,
                  "text/csv;charset=utf-8",
                )
              }
            >
              Download errors CSV
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
