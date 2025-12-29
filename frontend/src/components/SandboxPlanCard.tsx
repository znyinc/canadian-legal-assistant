interface SandboxPlan {
  tier: string;
  label: string;
  rationale: string;
  actions: string[];
  humanReview: { required: boolean; reason?: string; steps: string[] };
  auditTrail: string[];
  controls: string[];
}

export function SandboxPlanCard({ plan }: { plan?: SandboxPlan }) {
  if (!plan) return null;

  const tierBadges: Record<string, string> = {
    'public-info': 'bg-green-100 text-green-800',
    'paralegal-supervised': 'bg-yellow-100 text-yellow-800',
    'a2i-sandbox': 'bg-red-100 text-red-800'
  };

  const badge = tierBadges[plan.tier] || 'bg-blue-100 text-blue-800';

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">A2I Sandbox Readiness</h3>
          <p className="text-sm text-gray-700">{plan.rationale}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded ${badge}`}>{plan.label}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Actions</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.actions.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>

          <p className="text-sm font-semibold text-gray-800 mt-3">Controls</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.controls.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">Human-in-the-loop</p>
          <div className={`rounded border p-3 ${plan.humanReview.required ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
            <p className="text-sm font-medium text-gray-900">{plan.humanReview.required ? 'Human review required' : 'Informational only (no advice)'}</p>
            {plan.humanReview.reason && <p className="text-sm text-gray-700 mt-1">Reason: {plan.humanReview.reason}</p>}
            <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
              {plan.humanReview.steps.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-semibold text-gray-800 mt-3">Audit Trail</p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {plan.auditTrail.map((a, idx) => (
              <li key={idx}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
