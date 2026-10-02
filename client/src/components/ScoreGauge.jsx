/**
 * Circular SVG gauge for the 0-100 match score.
 * Color shifts from red -> amber -> green as the score increases.
 */
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const getColor = (score) => {
  if (score >= 75) return '#16a34a'; // green-600
  if (score >= 50) return '#d97706'; // amber-600
  return '#dc2626'; // red-600
};

export default function ScoreGauge({ score }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = getColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {clamped}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            out of 100
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">
        {clamped >= 75
          ? 'Strong match 🎉'
          : clamped >= 50
            ? 'Decent match — room to improve'
            : 'Weak match — significant gaps'}
      </p>
    </div>
  );
}
