"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { LibraryFilter, LibraryResource } from "@/types/library";
import { useLocale } from "@/components/LocaleProvider";
import {
  filterLibraryResources,
  getLibraryActionLabel,
  getLibraryCategory,
  getLibraryDescription,
  getLibraryLayout,
  getLibraryTitle,
  getLibraryTypeLabel,
} from "@/lib/library";
import { msg } from "@/lib/i18n";

/** Serve external HTTPS thumbnails as-is without domain allowlists or recompression. */
function libraryThumbLoader({ src }: { src: string }) {
  return src;
}

const FILTERS: LibraryFilter[] = ["all", "videos", "books", "research", "podcasts", "free"];

type LibraryClientProps = {
  resources: LibraryResource[];
};

function getFilterLabel(filter: LibraryFilter, locale: "en" | "ar"): string {
  return msg(`library.filter.${filter}`, locale);
}

export function LibraryClient({ resources }: LibraryClientProps) {
  const { locale } = useLocale();
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const layout = getLibraryLayout(locale);

  const filteredResources = useMemo(
    () => filterLibraryResources(resources, activeFilter, query),
    [activeFilter, query, resources],
  );

  const isTrulyEmpty = resources.length === 0;

  return (
    <div className={layout.rootClassName} dir={layout.dir}>
      <section className="library-hero">
        <div className="library-hero-motif" aria-hidden="true" />
        <div className="container library-hero-inner">
          <p className="eyebrow">{msg("library.eyebrow", locale)}</p>
          <h1 className="display display-lg library-title">{msg("library.title", locale)}</h1>
          <div className="section-rule" aria-hidden="true" />
          <p className="lead library-lead">{msg("library.subtitle", locale)}</p>
        </div>
      </section>

      <section className="section library-section">
        <div className="container library-stack">
          <div className="library-toolbar">
            <div className="library-filter-row" role="tablist" aria-label={msg("library.filtersLabel", locale)}>
              {FILTERS.map((filter) => {
                const active = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    className={active ? "library-filter active" : "library-filter"}
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={active}
                  >
                    {getFilterLabel(filter, locale)}
                  </button>
                );
              })}
            </div>

            <label className="library-search">
              <span className="visually-hidden">{msg("library.searchLabel", locale)}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={msg("library.searchPlaceholder", locale)}
                aria-label={msg("library.searchLabel", locale)}
              />
            </label>
          </div>

          {isTrulyEmpty ? (
            <div className="library-empty">
              <div className="library-empty-mark" aria-hidden="true" />
              <p className="eyebrow">{msg("library.eyebrow", locale)}</p>
              <h2 className="display display-md">{msg("library.emptyTitle", locale)}</h2>
              <p className="muted">{msg("library.emptyBody", locale)}</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="library-empty">
              <div className="library-empty-mark" aria-hidden="true" />
              <p className="eyebrow">{msg("library.eyebrow", locale)}</p>
              <h2 className="display display-md">{msg("library.noResultsTitle", locale)}</h2>
              <p className="muted">{msg("library.noResultsBody", locale)}</p>
            </div>
          ) : (
            <div
              className={
                filteredResources.length < 3
                  ? "library-grid library-grid--sparse"
                  : "library-grid"
              }
            >
              {filteredResources.map((resource, index) => (
                <article
                  key={resource.id}
                  className={
                    index === 0 && filteredResources.length === 1
                      ? "library-card library-card--wide"
                      : "library-card"
                  }
                >
                  {resource.thumbnail_url ? (
                    <div className="library-thumb-frame">
                      <Image
                        loader={libraryThumbLoader}
                        src={resource.thumbnail_url}
                        alt=""
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        className="library-thumb"
                        loading="lazy"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="library-thumb library-thumb-placeholder" aria-hidden="true">
                      <div className="library-thumb-mark" />
                    </div>
                  )}

                  <div className="library-card-body">
                    <div className="library-card-meta">
                      <span className="library-badge">
                        {getLibraryTypeLabel(resource.type, locale)}
                      </span>
                      {resource.is_featured ? (
                        <span className="library-featured">
                          {msg("library.featured", locale)}
                        </span>
                      ) : null}
                    </div>

                    <div className="library-card-copy">
                      <h2 className="library-card-title">{getLibraryTitle(resource, locale)}</h2>
                      <p className="library-author">{resource.author}</p>
                      <p className="library-description">
                        {getLibraryDescription(resource, locale)}
                      </p>
                    </div>

                    <dl className="library-details">
                      <div>
                        <dt>{msg("library.category", locale)}</dt>
                        <dd>{getLibraryCategory(resource, locale)}</dd>
                      </div>
                      <div>
                        <dt>{msg("library.language", locale)}</dt>
                        <dd>{resource.language}</dd>
                      </div>
                    </dl>

                    <a
                      href={resource.destination_url}
                      className="btn btn-primary library-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {getLibraryActionLabel(resource.type, locale)}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
