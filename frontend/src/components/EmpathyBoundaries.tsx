interface EmpathyBoundaryPlan {
  audience: string;
  jurisdiction: string;
  canDo: string[];
  cannotDo: string[];
  safeHarbor: string;
  examples: { request: string; redirect: string }[];
}

export function EmpathyBoundaries({ plan }: { plan?: EmpathyBoundaryPlan }) {
  if (!plan) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-blue-100" aria-live="polite">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Information-Only Boundaries</h3>
          <p className="text-sm text-gray-600">Audience: {plan.audience || 'self-represented'} · Jurisdiction focus: {plan.jurisdiction}</p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-800 rounded">UPL Safe Harbor</span>
      </div>

      <p className="text-sm text-gray-700 mb-4">{plan.safeHarbor}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">What We CAN Do</p>
          <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
            {plan.canDo.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">What We CANNOT Do</p>
          <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
            {plan.cannotDo.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {plan.examples && plan.examples.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-gray-800 mb-1">How we redirect advice-seeking questions</p>
          <ul className="space-y-2 text-sm text-gray-700">
            {plan.examples.map((ex, idx) => (
              <li key={idx} className="border border-gray-200 rounded p-3 bg-gray-50">
                <p className="font-medium text-gray-800">User asked: <span className="italic">{ex.request}</span></p>
                <p className="text-gray-700">We respond: {ex.redirect}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
