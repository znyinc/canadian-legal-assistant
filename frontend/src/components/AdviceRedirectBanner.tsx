interface AdviceRedirect {
  redirected: boolean;
  message: string;
  options: string[];
  safeHarbor: string;
  tone: 'gentle' | 'firm';
}

export function AdviceRedirectBanner({ advice }: { advice?: AdviceRedirect }) {
  if (!advice) return null;

  const toneColor = advice.redirected ? 'bg-yellow-50 border-yellow-300 text-yellow-900' : 'bg-blue-50 border-blue-200 text-blue-900';

  return (
    <div className={`rounded-lg border p-4 ${toneColor}`} role="status" aria-live="polite">
      <div className="flex items-start gap-2">
        <span className="text-xl" aria-hidden>⚖️</span>
        <div className="flex-1">
          <p className="font-semibold text-sm mb-1">Information-only boundary</p>
          <p className="text-sm mb-2">{advice.message}</p>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            {advice.options.map((opt, idx) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-2">{advice.safeHarbor}</p>
        </div>
      </div>
    </div>
  );
}
