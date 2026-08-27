"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { issueCertificateAction } from "@/app/admin/(console)/certificates/actions";
import type { AdminCertificatesPageData } from "@/lib/admin/certificates/load";
import type { IssuedCertificateNotice } from "@/lib/admin/certificates/types";
import {
  canSubmitIssuance,
  formatCourseTitle,
} from "@/lib/admin/certificates/query";
import { certificatePdfDownloadPath, certificatePdfPreviewPath } from "@/lib/certificates/pdf/model";

function buildCertificatesHref(values: {
  q?: string;
  sq?: string;
  holder?: string | null;
  item?: string | null;
}): string {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.sq) params.set("sq", values.sq);
  if (values.holder) params.set("holder", values.holder);
  if (values.item) params.set("item", values.item);
  const qs = params.toString().replace(/\+/g, "%20");
  return qs ? `/admin/certificates?${qs}` : "/admin/certificates";
}

export function CertificatesClient({
  data,
  pdfPreviewEnabled = false,
}: {
  data: AdminCertificatesPageData;
  pdfPreviewEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [certificateQuery, setCertificateQuery] = useState(data.certificateQuery);
  const [studentQuery, setStudentQuery] = useState(data.studentQuery);
  const [issuedAt, setIssuedAt] = useState(
    data.preview?.proposedIssuedAt ?? data.proposedIssuedAt,
  );
  const [language, setLanguage] = useState(data.preview?.language ?? "");
  const [oldNumber, setOldNumber] = useState(
    data.preview?.oldCertificateNumber ?? "",
  );
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedCertificateNotice | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIssuedAt(data.preview?.proposedIssuedAt ?? data.proposedIssuedAt);
    setLanguage(data.preview?.language ?? "");
    setOldNumber(data.preview?.oldCertificateNumber ?? "");
    setFeedbackError(null);
  }, [
    data.selectedItemKey,
    data.preview?.proposedIssuedAt,
    data.preview?.language,
    data.preview?.oldCertificateNumber,
    data.proposedIssuedAt,
  ]);

  function currentParams() {
    return {
      q: searchParams.get("q") ?? "",
      sq: searchParams.get("sq") ?? "",
      holder: searchParams.get("holder"),
      item: searchParams.get("item"),
    };
  }

  function onCertificateSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const current = currentParams();
    router.push(
      buildCertificatesHref({
        q: certificateQuery.trim(),
        sq: current.sq,
        holder: current.holder,
        item: current.item,
      }),
    );
  }

  function onStudentSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      buildCertificatesHref({
        q: currentParams().q,
        sq: studentQuery.trim(),
        holder: null,
        item: null,
      }),
    );
  }

  function selectHolder(key: string) {
    const current = currentParams();
    setIssued(null);
    router.push(
      buildCertificatesHref({
        q: current.q,
        sq: current.sq,
        holder: key,
        item: null,
      }),
    );
  }

  function selectItem(key: string) {
    const current = currentParams();
    setIssued(null);
    router.push(
      buildCertificatesHref({
        q: current.q,
        sq: current.sq,
        holder: current.holder,
        item: key,
      }),
    );
  }

  function onIssue() {
    if (!data.selectedHolder || !data.selectedItemKey || !data.preview) return;
    const allowed = canSubmitIssuance({
      issuanceEnabled: data.issuanceEnabled,
      alreadyExists: data.preview.alreadyExists,
      holderSelected: true,
      itemSelected: true,
      issuedAt,
      holderDisplayName: data.preview.holderDisplayName,
    });
    if (!allowed) return;

    const courseLabel = formatCourseTitle(
      data.preview.courseTitleEn,
      data.preview.courseTitleAr,
    );
    const confirmed = window.confirm(
      `Issue an official certificate to ${data.preview.holderName} for ${courseLabel}?`,
    );
    if (!confirmed) return;

    setFeedbackError(null);
    setIssued(null);
    startTransition(async () => {
      const result = await issueCertificateAction({
        holderKey: data.selectedHolder!.key,
        itemKey: data.selectedItemKey!,
        issuedAt,
        language: language || null,
        oldCertificateNumber: oldNumber || null,
      });
      if (!result.ok) {
        setFeedbackError(
          result.alreadyExists && result.certificateNumber
            ? `Certificate already exists · ${result.certificateNumber}`
            : result.error,
        );
        return;
      }
      setIssued({
        certificateNumber: result.certificateNumber,
        holderDisplayName: result.holderDisplayName,
        courseTitleEn: result.courseTitleEn,
        courseTitleAr: result.courseTitleAr,
        issuedAt: result.issuedAt,
        status: result.status,
      });
      router.refresh();
    });
  }

  return (
    <div className="admin-certificates">
      <div className="admin-toolbar">
        <form className="admin-search" onSubmit={onCertificateSearch}>
          <label htmlFor="certificate-search" className="visually-hidden">
            Search certificates
          </label>
          <input
            id="certificate-search"
            type="search"
            placeholder="Search by official number, old number, student name, or course"
            value={certificateQuery}
            onChange={(event) => setCertificateQuery(event.target.value)}
          />
          <button type="submit" className="admin-btn-primary admin-btn-inline">
            Search certificates
          </button>
        </form>
      </div>

      <div className="admin-table-wrap admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Official number</th>
              <th>Holder</th>
              <th>Course</th>
              <th>Date</th>
              <th>Status</th>
              <th>Old number</th>
              <th>Student type</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {data.certificates.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-table-empty">
                  No certificates found.
                </td>
              </tr>
            ) : (
              data.certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td>
                    <Link href={`/verify/${certificate.certificateNumber}`}>
                      {certificate.certificateNumber}
                    </Link>
                  </td>
                  <td>{certificate.holderDisplayName}</td>
                  <td>
                    {formatCourseTitle(
                      certificate.courseTitleEn,
                      certificate.courseTitleAr,
                    )}
                  </td>
                  <td>{certificate.issuedAt}</td>
                  <td>
                    <span
                      className={
                        certificate.status === "issued"
                          ? "admin-status admin-status-ready"
                          : "admin-status admin-status-error"
                      }
                    >
                      {certificate.status}
                    </span>
                  </td>
                  <td>{certificate.oldCertificateNumber ?? "—"}</td>
                  <td>{certificate.holderKind}</td>
                  <td>
                    <div className="admin-pdf-actions">
                      {pdfPreviewEnabled ? (
                        <a
                          className="admin-link-button"
                          href={certificatePdfPreviewPath(
                            certificate.certificateNumber,
                          )}
                        >
                          Preview PDF
                        </a>
                      ) : null}
                      <a
                        className="admin-link-button"
                        href={certificatePdfDownloadPath(
                          certificate.certificateNumber,
                        )}
                      >
                        Download PDF
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="admin-section admin-panel" aria-label="Issuance preview">
        <header className="admin-page-header">
          <h2>Issuance preview</h2>
          <p>
            Search a student, select a course or historical completion, then
            issue one official certificate. Snapshots are rebuilt on the server.
          </p>
        </header>

        <div className="admin-toolbar">
          <form className="admin-search" onSubmit={onStudentSearch}>
            <label htmlFor="certificate-student-search" className="visually-hidden">
              Search student for issuance preview
            </label>
            <input
              id="certificate-student-search"
              type="search"
              placeholder="Search modern or legacy student by name or email"
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
            />
            <button type="submit" className="admin-btn-primary admin-btn-inline">
              Search student
            </button>
          </form>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.holders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-table-empty">
                    {data.studentQuery
                      ? "No matching students."
                      : "Search a student to preview issuance."}
                  </td>
                </tr>
              ) : (
                data.holders.map((holder) => (
                  <tr
                    key={holder.key}
                    className={
                      data.selectedHolder?.key === holder.key
                        ? "is-selected"
                        : undefined
                    }
                  >
                    <td>{holder.name}</td>
                    <td>{holder.email ?? "—"}</td>
                    <td>{holder.kind}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => selectHolder(holder.key)}
                      >
                        Select student
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.selectedHolder ? (
          <div className="admin-table-wrap">
            <h3>Courses and completions</h3>
            <p className="admin-table-note">
              Modern enrollments and legacy historical completions for{" "}
              {data.selectedHolder.name}.
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Status / completion</th>
                  <th>Old number</th>
                  <th>Official certificate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      No enrollments or historical completions found.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr
                      key={item.key}
                      className={
                        data.selectedItemKey === item.key
                          ? "is-selected"
                          : undefined
                      }
                    >
                      <td>
                        {formatCourseTitle(
                          item.courseTitleEn,
                          item.courseTitleAr,
                        )}
                      </td>
                      <td>{item.statusLabel}</td>
                      <td>{item.oldCertificateNumber ?? "—"}</td>
                      <td>
                        {item.existingCertificateNumber ? (
                          <span className="admin-status admin-status-duplicate">
                            Certificate already exists ·{" "}
                            {item.existingCertificateNumber}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-link-button"
                          onClick={() => selectItem(item.key)}
                        >
                          Preview issuance
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="admin-preview-block">
          <h3>Issuance</h3>
          {issued ? (
            <div className="admin-alert admin-alert-success" role="status">
              <p>
                <strong>Certificate issued</strong>
              </p>
              <dl className="admin-preview-list">
                <div>
                  <dt>Official number</dt>
                  <dd>
                    <Link href={`/verify/${issued.certificateNumber}`}>
                      {issued.certificateNumber}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt>Student</dt>
                  <dd>{issued.holderDisplayName}</dd>
                </div>
                <div>
                  <dt>Course</dt>
                  <dd>
                    {formatCourseTitle(
                      issued.courseTitleEn,
                      issued.courseTitleAr,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{issued.issuedAt}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{issued.status}</dd>
                </div>
              </dl>
              <p className="admin-form-actions">
                {pdfPreviewEnabled ? (
                  <a
                    className="admin-btn-ghost admin-btn-inline"
                    href={certificatePdfPreviewPath(issued.certificateNumber)}
                  >
                    Preview PDF
                  </a>
                ) : null}
                <a
                  className="admin-btn-primary admin-btn-inline"
                  href={certificatePdfDownloadPath(issued.certificateNumber)}
                >
                  Download PDF
                </a>
              </p>
            </div>
          ) : null}
          {data.preview ? (
            <>
              {data.preview.alreadyExists ? (
                <p className="admin-alert admin-alert-error" role="status">
                  Certificate already exists ·{" "}
                  {data.preview.existingCertificateNumber}
                </p>
              ) : (
                <p className="admin-alert" role="status">
                  Ready to issue. Confirm to allocate the next official number
                  for the issue year.
                </p>
              )}
              {feedbackError ? (
                <p className="admin-alert admin-alert-error" role="status">
                  {feedbackError}
                </p>
              ) : null}
              <dl className="admin-preview-list">
                <div>
                  <dt>Student</dt>
                  <dd>
                    {data.preview.holderName} ({data.preview.holderKind})
                  </dd>
                </div>
                <div>
                  <dt>Course</dt>
                  <dd>
                    {formatCourseTitle(
                      data.preview.courseTitleEn,
                      data.preview.courseTitleAr,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Issue date</dt>
                  <dd>
                    <label htmlFor="certificate-issued-at" className="visually-hidden">
                      Issue date
                    </label>
                    <input
                      id="certificate-issued-at"
                      type="date"
                      value={issuedAt}
                      onChange={(event) => setIssuedAt(event.target.value)}
                    />
                  </dd>
                </div>
                <div>
                  <dt>Language</dt>
                  <dd>
                    <label htmlFor="certificate-language" className="visually-hidden">
                      Certificate language
                    </label>
                    <select
                      id="certificate-language"
                      value={language}
                      onChange={(event) => setLanguage(event.target.value)}
                    >
                      <option value="">Not set</option>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>Old number</dt>
                  <dd>
                    <label htmlFor="certificate-old-number" className="visually-hidden">
                      Old certificate number
                    </label>
                    <input
                      id="certificate-old-number"
                      type="text"
                      value={oldNumber}
                      onChange={(event) => setOldNumber(event.target.value)}
                      placeholder="Optional historical number"
                    />
                  </dd>
                </div>
                <div>
                  <dt>Public snapshot — holder</dt>
                  <dd>{data.preview.holderDisplayName}</dd>
                </div>
                <div>
                  <dt>Public snapshot — course EN</dt>
                  <dd>{data.preview.courseTitleEn || "—"}</dd>
                </div>
                <div>
                  <dt>Public snapshot — course AR</dt>
                  <dd>{data.preview.courseTitleAr || "—"}</dd>
                </div>
              </dl>
              <div className="admin-form-actions">
                <button
                  type="button"
                  className="admin-btn-primary admin-btn-inline"
                  disabled={
                    pending ||
                    !canSubmitIssuance({
                      issuanceEnabled: data.issuanceEnabled,
                      alreadyExists: data.preview.alreadyExists,
                      holderSelected: Boolean(data.selectedHolder),
                      itemSelected: Boolean(data.selectedItemKey),
                      issuedAt,
                      holderDisplayName: data.preview.holderDisplayName,
                    })
                  }
                  onClick={onIssue}
                >
                  {pending ? "Issuing…" : "Issue certificate"}
                </button>
              </div>
            </>
          ) : (
            <p className="admin-placeholder">
              Select a student and a course or completion to preview snapshots.
              The official number is allocated only after confirmation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
