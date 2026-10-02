const ICONS = {
  strengths: { icon: '✅', ring: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700' },
  weaknesses: { icon: '⚠️', ring: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700' },
  matchingSkills: { icon: '🎯', ring: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700' },
  missingSkills: { icon: '🔍', ring: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700' },
  recommendations: { icon: '💡', ring: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

const TITLES = {
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  matchingSkills: 'Matching Skills',
  missingSkills: 'Missing Skills',
  recommendations: 'Actionable Recommendations',
};

/**
 * Renders one analysis breakdown card as a bulleted list.
 * `items` are strings; `emptyMessage` is shown when the list is empty.
 */
export default function AnalysisSection({ type, items, emptyMessage = 'Nothing to show here.' }) {
  const style = ICONS[type] || { icon: '•', ring: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700' };

  return (
    <section className={`rounded-2xl border p-5 ${style.ring} ${style.bg}`}>
      <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${style.text}`}>
        <span aria-hidden="true">{style.icon}</span>
        {TITLES[type] || 'Details'}
      </h3>

      {items?.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
}
