"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  deleteConsultationAction,
  updateConsultationStatusAction,
} from "@/app/admin/(console)/consultations/actions";
import { CONSULTATION_STATUS_LABELS } from "@/lib/admin/consultation/mutations";
import { CONSULTATION_STATUSES } from "@/lib/consultation/types";
import type { AdminConsultationListItem } from "@/lib/admin/consultation/list";
import type { ConsultationStatus } from "@/lib/consultation/types";

function statusClass(status: ConsultationStatus): string {
  if (status === "new") return "admin-status admin-status-warning";
  if (status === "closed") return "admin-status";
  if (status === "contacted") return "admin-status admin-status-ready";
  return "admin-status";
}

export function ConsultationsClient({
  requests,
  initialQuery,
  initialStatus,
}: {
  requests: AdminConsultationListItem[];
  initialQuery: string;
  initialStatus: ConsultationStatus | "all";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);
  const [pending, startTransition] = useTransition();

  function pushFilters(nextQuery: string, nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = nextQuery.trim();
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    else params.delete("status");
    const qs = params.toString();
    router.push(qs ? `/admin/consultations?${qs}` : "/admin/consultations");
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters(query, status);
  }

  function onFilterStatus(value: string) {
    setStatus(value as ConsultationStatus | "all");
    pushFilters(query, value);
  }

  function save(request: AdminConsultationListItem, nextStatus: string) {
    setFeedback(null);
    setFeedbackError(false);
    setPendingId(request.id);
    startTransition(async () => {
      const result = await updateConsultationStatusAction(
        request.id,
        nextStatus,
        notes[request.id] ?? request.admin_notes,
      );
      setPendingId(null);
      if (!result.ok) {
        setFeedbackError(true);
        setFeedback(result.error);
        return;
      }
      setFeedbackError(false);
      setFeedback("Request updated.");
      router.refresh();
    });
  }

  function remove(request: AdminConsultationListItem) {
    if (!window.confirm(`Delete the request from ${request.full_name}?`)) {
      return;
    }
    setPendingId(request.id);
    startTransition(async () => {
      const result = await deleteConsultationAction(request.id);
      setPendingId(null);
      if (!result.ok) {
        setFeedbackError(true);
        setFeedback(result.error);
        return;
      }
      setFeedbackError(false);
      setFeedback("Request deleted.");
      router.refresh();
    });
  }

  return (
    <div className="admin-consultations">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={onSearch}>
          <label htmlFor="consultation-search" className="visually-hidden">
            Search requests
          </label>
          <input
            id="consultation-search"
            type="search"
            placeholder="Search name, email or message"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="admin-btn-primary admin-btn-inline">
            Search
          </button>
        </form>
        <div className="admin-toolbar-actions">
          <label htmlFor="consultation-status-filter" className="visually-hidden">
            Filter by status
          </label>
          <select
            id="consultation-status-filter"
            className="admin-filter-select"
            value={status}
            onChange={(event) => onFilterStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {CONSULTATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {CONSULTATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
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
        </div>
      ) : null}

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No consultation requests yet.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const open = openId === request.id;
                return (
                  <tr key={request.id}>
                    <td>
                      {new Date(request.created_at).toLocaleString("en-GB")}
                      <p className="admin-table-note">{request.locale.toUpperCase()}</p>
                    </td>
                    <td>
                      {request.full_name}
                      <p className="admin-table-note">{request.email}</p>
                      {request.phone ? (
                        <p className="admin-table-note">{request.phone}</p>
                      ) : null}
                    </td>
                    <td>
                      {request.request_type === "consultation"
                        ? "Consultation"
                        : "Information"}
                    </td>
                    <td>
                      <span className={statusClass(request.status)}>
                        {CONSULTATION_STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-inline-actions">
                        <button
                          type="button"
                          className="admin-btn-ghost admin-btn-inline"
                          onClick={() =>
                            setOpenId(open ? null : request.id)
                          }
                        >
                          {open ? "Hide" : "Open"}
                        </button>
                      </div>
                      {open ? (
                        <div className="admin-request-detail">
                          <p className="admin-request-message">{request.message}</p>
                          <label className="admin-field">
                            Status
                            <select
                              key={`${request.id}-${request.status}`}
                              defaultValue={request.status}
                              onChange={(event) =>
                                save(request, event.target.value)
                              }
                              disabled={pending && pendingId === request.id}
                            >
                              {CONSULTATION_STATUSES.map((value) => (
                                <option key={value} value={value}>
                                  {CONSULTATION_STATUS_LABELS[value]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="admin-field">
                            Admin notes
                            <textarea
                              rows={3}
                              value={notes[request.id] ?? request.admin_notes}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <div className="admin-form-actions">
                            <button
                              type="button"
                              className="admin-btn-primary admin-btn-inline"
                              disabled={pending && pendingId === request.id}
                              onClick={() => save(request, request.status)}
                            >
                              Save notes
                            </button>
                            <button
                              type="button"
                              className="admin-btn-ghost admin-btn-inline"
                              disabled={pending && pendingId === request.id}
                              onClick={() => remove(request)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : null}
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
