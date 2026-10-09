import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TemplatePreview from '../components/TemplatePreview';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TEMPLATES, getTemplate } from '../data/templates';

const FORMATS = {
  pdf: { label: 'PDF', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

function FormatBadges({ formats }) {
  if (!formats?.length) return null;
  return (
    <span className="flex gap-1">
      {formats.map((f) => (
        <span
          key={f}
          className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
            FORMATS[f]?.className || 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {FORMATS[f]?.label || f}
        </span>
      ))}
    </span>
  );
}

export default function Templates() {
  const { user, setPreferredTemplate } = useAuth();
  const selected = user?.preferredTemplate ?? null;
  const selectedTemplate = getTemplate(selected);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const dialogRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const matchesCategory =
        category === 'All' || t.categories.includes(category);
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.slug.replace(/[-_]/g, ' ').includes(q) ||
        t.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  // Close the preview on Escape.
  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);

  const choose = async (slug) => {
    setSaving(true);
    setMessage(null);
    const result = await setPreferredTemplate(slug);
    setSaving(false);
    setMessage(
      result.ok
        ? { tone: 'success', text: `“${getTemplate(slug)?.name}” saved as your template.` }
        : { tone: 'error', text: result.message }
    );
  };

  const clear = async () => {
    setSaving(true);
    setMessage(null);
    const result = await setPreferredTemplate(null);
    setSaving(false);
    setMessage(
      result.ok
        ? { tone: 'success', text: 'Template selection cleared.' }
        : { tone: 'error', text: result.message }
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" style="letter-spacing: -0.374px">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="typography-hero-display font-bold text-slate-900">CV templates</h1>
          <p className="mt-2 max-w-xl text-slate-600 typography-body small">
            {TEMPLATES.length} professional layouts from FlowCV's free gallery, previewed with
            real designs. Save the one you want as your default.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-none border border-border-soft px-4 py-2.5 typography-button-utility text-slate-700 transition hover:bg-slate-200"
        >
          Back to analyzer
        </Link>
      </div>

      {/* Current selection */}
      <div className="mb-8 rounded-none border border-border-soft bg-canvas/50 p-5" style="letter-spacing: -0.374px">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectedTemplate ? (
              <div className="w-16 shrink-0 overflow-hidden rounded-none border border-border-soft bg-white">
                <TemplatePreview template={selectedTemplate} />
              </div>
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-none border border-dashed border-border-soft bg-white text-lg">
                📄
              </div>
            )}
            <div>
              <p className="typography-body smallest uppercase tracking-wide text-primary">
                Your template
              </p>
              <p className="typography-body lg font-bold text-slate-900">
                {selectedTemplate ? selectedTemplate.name : 'None selected yet'}
              </p>
              {selectedTemplate && (
                <p className="mt-0.5 typography-body smallest text-slate-600">{selectedTemplate.description}</p>
              )}
            </div>
          </div>
          {selectedTemplate && (
            <button
              onClick={clear}
              disabled={saving}
              className="rounded-none border border-primary px-4 py-2 typography-button-utility text-primary transition hover:bg-primary/10 disabled:opacity-50"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-6 rounded-xl border px-4 py-3 typography-small ${
            message.tone === 'success'
              ? 'border-primary/20 bg-primary/5 text-primary'
              : 'border-surface-tile-1 bg-surface-tile-1/50 text-on-dark'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" style="letter-spacing: -0.374px">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          aria-label="Search templates"
          className="w-full rounded-none border border-primary bg-canvas px-4 py-2.5 typography-body outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`rounded-full px-3.5 py-1.5 typography-button-utility transition ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 typography-body small text-slate-500">
        Showing {results.length} of {TEMPLATES.length}
      </p>

      {results.length === 0 ? (
        <section
          className="rounded-none border border-border-soft bg-surface-tile-1 p-12 text-center"
          style="letter-spacing: -0.374px"
        >
          <p className="text-4xl">🔍</p>
          <h2 className="mt-4 typography-display-lg font-bold text-slate-900">No templates match</h2>
          <p className="mt-2 typography-body small text-slate-500">
            Try a different search term or clear the category filter.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
            className="my-6 rounded-none button-primary rounded-pill py-2.5 typography-body strong text-white hover:bg-primary/10"
          >
            Reset filters
          </button>
        </section>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((t) => {
            const isSelected = t.slug === selected;
            return (
              <li key={t.slug} className="rounded-none border border-border-0 bg-white p-4 shadow-sm transition">
                <button
                  type="button"
                  onClick={() => setPreview(t)}
                  className="flex-1 cursor-zoom-in text-left"
                  aria-label={`Preview ${t.name} template`}
                >
                  <TemplatePreview template={t} />
                </button>

                <div className="mt-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">
                      {t.name}
                      {t.featured && (
                        <span className="ml-2 align-middle typography-caption small font-semibold uppercase tracking-wider text-primary">
                          Popular
                        </span>
                      )}
                    </h3>
                    <p className="mt-0.5 typography-body smallest leading-relaxed text-slate-500">
                      {t.description}
                    </p>
                  </div>
                  <FormatBadges formats={t.formats} />
                </div>

                <button
                  onClick={() => choose(t.slug)}
                  disabled={saving || isSelected}
                  className={`mt-4 w-full rounded-none py-2 typography-button-utility transition ${
                    isSelected
                      ? 'cursor-default bg-primary/5 text-primary'
                      : 'bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60'
                  }`}
                >
                  {isSelected ? '✓ Selected' : saving ? 'Saving…' : 'Use this template'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Preview dialog */}
      {preview && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${preview.name} template preview`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-none bg-white shadow-sm md:flex-row">
            <div className="max-h-[45vh] shrink-0 bg-slate-900 p-4 md:max-h-none md:w-1/2 md:p-6">
              <div className="mx-auto max-w-[260px]">
                <TemplatePreview template={preview} />
              </div>
            </div>

            <div className="flex flex-col p-4 md:w-1/2 md:overflow-y-auto md:p-8">
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="absolute right-4 top-4 rounded-none flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-slate-400 transition hover:bg-slate-700"
              >
                ✕
              </button>

              <h2 className="typography-hero-display font-bold text-slate-900">{preview.name}</h2>
              <p className="mt-2 typography-body small leading-relaxed text-slate-600">
                {preview.description}
              </p>

              <dl className="mt-6 space-y-3 typography-body small">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Categories</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {preview.categories.join(', ')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Downloads</dt>
                  <dd>
                    <FormatBadges formats={preview.formats} />
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Source</dt>
                  <dd>
                    <a
                      href={preview.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="typography-body small font-medium text-primary underline-offset-2 hover:underline"
                    >
                      View on FlowCV ↗
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-auto pt-8">
                <button
                  onClick={() => choose(preview.slug)}
                  disabled={saving || preview.slug === selected}
                  className={`w-full rounded-none py-3 typography-button-utility transition ${
                    preview.slug === selected
                      ? 'cursor-default bg-primary/5 text-primary'
                      : 'bg-primary text-white hover:bg-primary/10 disabled:opacity-60'
                  }`}
                >
                  {preview.slug === selected
                    ? '✓ This is your template'
                    : saving
                      ? 'Saving…'
                      : 'Use this template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}