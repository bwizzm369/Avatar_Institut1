"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { activateLegacyStudentAction } from "@/app/admin/(console)/students/actions";
import type { AdminStudentListItem } from "@/lib/admin/students/list";

export function StudentsClient({
  students,
  initialQuery,
}: {
  students: AdminStudentListItem[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );
  const [feedbackError, setFeedbackError] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/admin/students?${qs}` : "/admin/students");
  }

  function onActivate(student: AdminStudentListItem) {
    if (!student.legacyStudentId) return;
    setFeedback(null);
    setTemporaryPassword(null);
    setFeedbackError(false);
    setPendingId(student.id);
    startTransition(async () => {
      const result = await activateLegacyStudentAction(student.legacyStudentId!);
      setPendingId(null);
      if (!result.ok) {
        setFeedbackError(true);
        setFeedback(result.error);
        return;
      }
      setFeedbackError(false);
      setFeedback(result.message);
      setTemporaryPassword(result.temporaryPassword ?? null);
      router.refresh();
    });
  }

  return (
    <div className="admin-students">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={onSearch}>
          <label htmlFor="student-search" className="visually-hidden">
            Search student
          </label>
          <input
            id="student-search"
            type="search"
            placeholder="Search student by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="admin-btn-primary admin-btn-inline">
            Search student
          </button>
        </form>
        <div className="admin-toolbar-actions">
          <Link href="/admin/import" className="admin-btn-primary admin-btn-inline">
            Import Students
          </Link>
        </div>
      </div>

      {feedback ? (
        <div
          className={
            feedbackError
              ? "admin-alert admin-alert-error"
              : "admin-alert admin-alert-success"
          }
          role="status"
        >
          <p>{feedback}</p>
          {temporaryPassword ? (
            <div className="admin-temp-password">
              <p>
                <strong>Temporary password</strong> (shown once — copy it now):
              </p>
              <code className="admin-temp-password-value">
                {temporaryPassword}
              </code>
              <p className="admin-table-note">
                Share it securely with the student. It is not stored in the
                database. The student should change it after signing in.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Historical courses</th>
              <th>Account status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const canActivate =
                  student.source === "legacy" &&
                  student.accountStatus === "NOT ACTIVATED" &&
                  Boolean(student.legacyStudentId) &&
                  Boolean(student.email);

                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.email ?? "—"}</td>
                    <td>
                      {student.historicalCourses.length > 0
                        ? student.historicalCourses.join(", ")
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={
                          student.accountStatus === "ACTIVE"
                            ? "admin-status admin-status-ready"
                            : "admin-status admin-status-warning"
                        }
                      >
                        {student.accountStatus}
                      </span>
                      {student.accountStatus === "NOT ACTIVATED" &&
                      !student.email ? (
                        <p className="admin-table-note">
                          Email required to activate
                        </p>
                      ) : null}
                    </td>
                    <td>
                      {canActivate ? (
                        <button
                          type="button"
                          className="admin-link-button"
                          disabled={pending && pendingId === student.id}
                          onClick={() => onActivate(student)}
                        >
                          {pending && pendingId === student.id
                            ? "Activating…"
                            : "Activate account"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
