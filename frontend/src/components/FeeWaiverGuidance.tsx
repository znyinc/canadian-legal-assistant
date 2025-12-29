interface FeeWaiverGuidanceProps {
  guidance: {
    isEligible: 'yes' | 'maybe' | 'no' | 'n/a';
    criteria: string[];
    applicationProcess: string[];
    approvalChance: 'high' | 'medium' | 'low' | 'n/a';
    encouragement: string;
    learnMoreUrl?: string;
  };
}

/**
 * Displays fee waiver eligibility guidance with application instructions.
 * Shows eligibility status, criteria, application process, and encouragement.
 */
export function FeeWaiverGuidance({ guidance }: FeeWaiverGuidanceProps) {
  const eligibilityBadgeColor = {
    yes: 'bg-green-100 text-green-800 border-green-200',
    maybe: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    no: 'bg-red-100 text-red-800 border-red-200',
    'n/a': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const eligibilityBadgeText = {
    yes: '✓ Likely Eligible',
    maybe: '? Possibly Eligible',
    no: '✗ Likely Not Eligible',
    'n/a': 'N/A - No Filing Fees',
  };

  const approvalBadgeColor = {
    high: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-red-50 text-red-700 border-red-200',
    'n/a': 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const approvalBadgeText = {
    high: 'High Approval Chance',
    medium: 'Medium Approval Chance',
    low: 'Low Approval Chance',
    'n/a': 'N/A',
  };

  if (guidance.isEligible === 'n/a') {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${eligibilityBadgeColor['n/a']}`}>
            {eligibilityBadgeText['n/a']}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          This forum does not charge filing fees, so fee waivers are not applicable.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Fee Waiver Eligibility</h3>

      {/* Eligibility Status */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-4 py-2 rounded-lg text-base font-medium border-2 ${eligibilityBadgeColor[guidance.isEligible]}`}>
          {eligibilityBadgeText[guidance.isEligible]}
        </span>
      </div>

      {/* Approval Chance (if applicable) */}
      {guidance.approvalChance !== 'n/a' && (
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${approvalBadgeColor[guidance.approvalChance]}`}>
            {approvalBadgeText[guidance.approvalChance]}
          </span>
        </div>
      )}

      {/* Criteria */}
      {guidance.criteria.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Eligibility Criteria:</h4>
          <ul className="list-disc list-inside space-y-1">
            {guidance.criteria.map((criterion, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Application Process */}
      {guidance.applicationProcess.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">How to Apply:</h4>
          <ol className="list-decimal list-inside space-y-1">
            {guidance.applicationProcess.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Encouragement */}
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-sm text-blue-900">
          💡 <strong>Good to know:</strong> {guidance.encouragement}
        </p>
      </div>

      {/* Learn More Link */}
      {guidance.learnMoreUrl && (
        <div className="mt-4">
          <a
            href={guidance.learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Learn more about fee waivers →
          </a>
        </div>
      )}
    </div>
  );
}
