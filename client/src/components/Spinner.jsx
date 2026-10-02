export default function Spinner({ label = 'Loading…', size = 'h-8 w-8' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10" role="status" aria-live="polite">
      <div
        className={`${size} animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600`}
      />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
