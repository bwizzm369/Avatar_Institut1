"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  createCourseAction,
  updateCourseAction,
} from "@/app/admin/(console)/courses/actions";
import type { AdminCourseFormInput } from "@/lib/admin/courses/types";

export function CourseFormClient({
  mode,
  courseId,
  initial,
}: {
  mode: "create" | "edit";
  courseId?: string;
  initial: AdminCourseFormInput;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCourseAction(formData)
          : await updateCourseAction(courseId!, formData);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? []);
        return;
      }
      router.push(`/admin/courses/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form className="admin-form admin-course-form" onSubmit={onSubmit}>
      <div className="admin-field">
        <label htmlFor="title_ar">Arabic title *</label>
        <input
          id="title_ar"
          name="title_ar"
          required
          defaultValue={initial.title_ar}
          dir="rtl"
          lang="ar"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="title_en">English title</label>
        <input id="title_en" name="title_en" defaultValue={initial.title_en} />
        <p className="admin-field-hint">
          Optional. If empty, the Arabic title is shown on the English site.
        </p>
      </div>
      <div className="admin-field">
        <label htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          defaultValue={initial.slug}
          placeholder="Leave empty to generate"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="description_ar">Arabic description</label>
        <textarea
          id="description_ar"
          name="description_ar"
          rows={4}
          defaultValue={initial.description_ar}
          dir="rtl"
          lang="ar"
        />
      </div>
      <div className="admin-field">
        <label htmlFor="description_en">English description</label>
        <textarea
          id="description_en"
          name="description_en"
          rows={4}
          defaultValue={initial.description_en}
        />
        <p className="admin-field-hint">
          Optional. If empty, the Arabic description is shown on the English site.
        </p>
      </div>
      <div className="admin-field-row">
        <div className="admin-field">
          <label htmlFor="price">Price (major units)</label>
          <input
            id="price"
            name="price"
            inputMode="decimal"
            placeholder="e.g. 99.00"
            defaultValue={initial.price}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="currency">Currency</label>
          <select id="currency" name="currency" defaultValue={initial.currency}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor="image_url">Image URL</label>
        <input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={initial.image_url}
        />
      </div>

      <fieldset className="admin-fieldset">
        <legend>Flags</legend>
        <label className="admin-check">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial.is_published}
          />
          Published
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            name="is_for_sale"
            defaultChecked={initial.is_for_sale}
          />
          For sale
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            name="student_pass_included"
            defaultChecked={initial.student_pass_included}
          />
          Included in Student Pass
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            name="legacy_only"
            defaultChecked={initial.legacy_only}
          />
          Historical (legacy only)
        </label>
      </fieldset>

      <div className="admin-field">
        <label htmlFor="student_pass_discount_percent">
          Student Pass discount (%)
        </label>
        <input
          id="student_pass_discount_percent"
          name="student_pass_discount_percent"
          inputMode="numeric"
          min={0}
          max={100}
          defaultValue={initial.student_pass_discount_percent || "0"}
        />
        <p className="admin-field-hint">
          Ignored while course is included in Student Pass.
        </p>
      </div>

      {error ? (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
          {fieldErrors.length > 0 ? (
            <ul>
              {fieldErrors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn-primary" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create course" : "Save changes"}
        </button>
        <Link href="/admin/courses" className="admin-btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
