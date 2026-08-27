"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  activateStudentPassAction,
  cancelStudentPassAction,
  deactivateStudentPassAction,
} from "@/app/admin/(console)/student-pass/actions";
import type { AdminStudentPassListItem } from "@/lib/admin/student-pass/list";
import { studentMemberId } from "@/lib/student-pass/membership";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClass(status: AdminStudentPassListItem["status"]): string {
  if (status === "active") return "admin-status admin-status-ready";
  if (status === "cancelled" || status === "expired") {
    return "admin-status admin-status-error";
  }
  if (status === "inactive") return "admin-status admin-status-warning";
  return "admin-status admin-status-duplicate";
}

export function StudentPassClient({
  members,
  initialQuery,
}: {
  members: AdminStudentPassListItem[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    const qs = params.toString();
    router.push(qs ? `/admin/student-pass?${qs}` : "/admin/student-pass");
  }

  async function runAction(
    profileId: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setPendingId(profileId);
    setError(null);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(result.error ?? "Action failed.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="admin-student-pass">
      <form className="admin-search" onSubmit={onSearch}>
        <label htmlFor="student-pass-search" className="visually-hidden">
          Search student
        </label>
        <input
          id="student-pass-search"
          type="search"
          placeholder="Search by name, email, member ID, status, or source"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="admin-btn-primary admin-btn-inline">
          Search
        </button>
      </form>

      {error ? (
        <p className="admin-alert admin-alert-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Member ID</th>
              <th>Status</th>
              <th>Started</th>
              <th>Expires</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  No students found.
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const busy = pendingId === member.profileId;
                return (
                  <tr key={member.profileId}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td className="admin-member-id" dir="ltr">
                      {studentMemberId(member.profileId)}
                    </td>
                    <td>
                      <span className={statusClass(member.status)}>
                        {member.status}
                      </span>
                    </td>
                    <td>{formatDate(member.startedAt)}</td>
                    <td>{formatDate(member.expiresAt)}</td>
                    <td>{member.source ?? "—"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn-primary admin-btn-inline"
                          disabled={busy || member.isEntitled}
                          onClick={() =>
                            runAction(member.profileId, () =>
                              activateStudentPassAction(
                                member.profileId,
                                "manual",
                              ),
                            )
                          }
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-inline"
                          disabled={busy || member.isEntitled}
                          title="Activate with source = offline"
                          onClick={() =>
                            runAction(member.profileId, () =>
                              activateStudentPassAction(
                                member.profileId,
                                "offline",
                              ),
                            )
                          }
                        >
                          Offline
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-inline"
                          disabled={
                            busy ||
                            member.status === "none" ||
                            member.status === "inactive"
                          }
                          onClick={() =>
                            runAction(member.profileId, () =>
                              deactivateStudentPassAction(member.profileId),
                            )
                          }
                        >
                          Deactivate
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-inline"
                          disabled={
                            busy ||
                            member.status === "none" ||
                            member.status === "cancelled"
                          }
                          onClick={() =>
                            runAction(member.profileId, () =>
                              cancelStudentPassAction(member.profileId),
                            )
                          }
                        >
                          Cancel
                        </button>
                      </div>
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
