import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TemplatePreview from '../components/TemplatePreview';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TEMPLATES, getTemplate } from '../data/templates';

const FORMATS = {
  pdf: { label: 'PDF', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  docx: { label: 'Word', className: 'bg-sky-50 text-sky-700 border-sky-200' },
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
        t.slug.replace(/_/g, ' ').includes(q) ||
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">CV templates</h1>
          <p className="mt-2 max-w-xl text-slate-600">
            {TEMPLATES.length} professional layouts. Preview each one, then save the design you want
            as your default.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back to analyzer
        </Link>
      </div>

      {/* Current selection */}
      <div className="mb-8 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {selectedTemplate ? (
              <div className="w-16 shrink-0 overflow-hidden rounded-lg border border-indigo-200 bg-white">
                <TemplatePreview template={selectedTemplate} />
              </div>
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-indigo-300 bg-white text-lg">
                📄
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Your template
              </p>
              <p className="text-lg font-bold text-slate-900">
                {selectedTemplate ? selectedTemplate.name : 'None selected yet'}
              </p>
              {selectedTemplate && (
                <p className="mt-0.5 text-sm text-slate-600">{selectedTemplate.description}</p>
              )}
            </div>
          </div>
          {selectedTemplate && (
            <button
              onClick={clear}
              disabled={saving}
              className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            message.tone === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          aria-label="Search templates"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-500">
        Showing {results.length} of {TEMPLATES.length}
      </p>

      {results.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-4xl">🔍</p>
          <h2 className="mt-4 text-lg font-bold text-slate-900">No templates match</h2>
          <p className="mt-2 text-sm text-slate-500">
            Try a different search term or clear the category filter.
          </p>
          <button
            onClick={() => {
              setQuery('');
              setCategory('All');
            }}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((t) => {
            const isSelected = t.slug === selected;
            return (
              <li key={t.slug}>
                <div
                  className={`group flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-100'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
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
                          <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                            Popular
                          </span>
                        )}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {t.description}
                      </p>
                    </div>
                    <FormatBadges formats={t.formats} />
                  </div>

                  <button
                    onClick={() => choose(t.slug)}
                    disabled={saving || isSelected}
                    className={`mt-4 w-full rounded-lg py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'cursor-default bg-indigo-50 text-indigo-700'
                        : 'bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-60'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : saving ? 'Saving…' : 'Use this template'}
                  </button>
                </div>
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
          <div className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl md:flex-row">
            <div className="max-h-[45vh] shrink-0 bg-slate-100 p-6 md:max-h-none md:w-1/2 md:p-10">
              <div className="mx-auto max-w-[260px] shadow-xl">
                <TemplatePreview template={preview} />
              </div>
            </div>

            <div className="flex flex-col p-6 md:w-1/2 md:overflow-y-auto md:p-8">
              <button
                onClick={() => setPreview(null)}
                aria-label="Close preview"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-slate-900">{preview.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {preview.description}
              </p>

              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Layout</dt>
                  <dd className="font-medium capitalize text-slate-900">
                    {preview.layout.replace('-', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Best for</dt>
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
                  <dt className="text-slate-500">Monochrome option</dt>
                  <dd className="font-medium text-slate-900">
                    {preview.monochrome ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto pt-8">
                <button
                  onClick={() => choose(preview.slug)}
                  disabled={saving || preview.slug === selected}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
                    preview.slug === selected
                      ? 'cursor-default bg-indigo-50 text-indigo-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
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