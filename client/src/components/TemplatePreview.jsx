import { useState } from 'react';

export default function TemplatePreview({ template, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !template.image) {
    return (
      <div
        className={`${className} flex aspect-[1/1.414] flex-col overflow-hidden rounded-md bg-slate-900 p-6`}
        role="img"
        aria-label={`${template.name} template layout preview`}
      >
        <div className="mb-2 h-2 w-1/2 rounded-sm bg-slate-700" />
        <div className="mb-3 h-1.5 w-2/3 rounded-sm bg-slate-600" />
        <div className="space-y-1">
          {[92, 78, 96, 60, 85, 72, 90, 66].map((w, i) => (
            <div
              key={i}
              className="h-1 rounded-full bg-slate-600"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <img
      src={template.image}
      alt={`${template.name} CV template preview`}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={`${className} h-auto w-full select-none`}
    />
  );
}