const TITLES = {
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  matchingSkills: 'Matching Skills',
  missingSkills: 'Missing Skills',
  recommendations: 'Actionable Recommendations',
};

const variantStyles = {
  strengths: {
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    text: 'text-slate-100',
    heading: 'text-slate-100',
  },
  weaknesses: {
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    text: 'text-slate-100',
    heading: 'text-slate-100',
  },
  matchingSkills: {
    bg: 'bg-canvas-parchment',
    border: 'border-canvas-parchment/50',
    text: 'text-slate-900',
    heading: 'text-slate-900',
  },
  missingSkills: {
    bg: 'bg-surface-tile-1',
    border: 'border-surface-tile-1',
    text: 'text-on-dark',
    heading: 'text-on-dark',
  },
  recommendations: {
    bg: 'bg-canvas',
    border: 'border-divider-soft',
    text: 'text-ink',
    heading: 'text-ink',
  },
};

export default function AnalysisSection({ type, items, emptyMessage = 'Nothing to show here.' }) {
  const s = variantStyles[type] || variantStyles.recommendations;

  return (
    <section
      className={`rounded-none border ${s.border} p-6 ${s.bg}`}
      style="letter-spacing: -0.374px"
    >
      <h3 className={s.heading + ' font-bold uppercase tracking-wider text-sm'}>
        <span aria-hidden="true">🔍</span>{TITLES[type] || 'Details'}
      </h3>

      {items?.length ? (
        <ul className="mt-6 space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2 leading-relaxed">
              <span
                aria-hidden="true"
                className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-primary/10"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic" style="color: var(--color-slate-500)">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}