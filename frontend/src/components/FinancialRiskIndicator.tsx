import { useState } from 'react';

interface FinancialRiskIndicatorProps {
  assessment: {
    riskLevel: 'minimal' | 'moderate' | 'significant' | 'substantial';
    totalExposure: { min: number; max: number };
    breakdown: {
      filingFees: { min: number; max: number };
      legalFees?: { min: number; max: number };
      otherCosts: { min: number; max: number };
      costAwardRisk: { min: number; max: number };
    };
    recommendations: string[];
    warningMessages: string[];
  };
}

/**
 * Visual risk level indicator with detailed financial exposure breakdown.
 * Shows risk badge, exposure metrics, breakdown table, recommendations, and warnings.
 */
export function FinancialRiskIndicator({ assessment }: FinancialRiskIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRange = (range: { min: number; max: number }) => {
    if (range.min === range.max) {
      return formatCurrency(range.min);
    }
    return `${formatCurrency(range.min)} - ${formatCurrency(range.max)}`;
  };

  const riskConfig = {
    minimal: {
      color: 'bg-green-100 text-green-900 border-green-300',
      progressColor: 'bg-green-500',
      icon: '✓',
      label: 'Minimal Risk',
      description: 'Total exposure under $1,000',
    },
    moderate: {
      color: 'bg-yellow-100 text-yellow-900 border-yellow-300',
      progressColor: 'bg-yellow-500',
      icon: '⚠',
      label: 'Moderate Risk',
      description: 'Total exposure $1,000 - $5,000',
    },
    significant: {
      color: 'bg-orange-100 text-orange-900 border-orange-300',
      progressColor: 'bg-orange-500',
      icon: '⚠️',
      label: 'Significant Risk',
      description: 'Total exposure $5,000 - $15,000',
    },
    substantial: {
      color: 'bg-red-100 text-red-900 border-red-300',
      progressColor: 'bg-red-500',
      icon: '🚨',
      label: 'Substantial Risk',
      description: 'Total exposure over $15,000',
    },
  };

  const config = riskConfig[assessment.riskLevel];

  const progressPercent = {
    minimal: 25,
    moderate: 50,
    significant: 75,
    substantial: 100,
  }[assessment.riskLevel];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Financial Risk Assessment</h3>

      {/* Risk Badge */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-medium border-2 ${config.color}`}>
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">{config.description}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${config.progressColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Total Exposure */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-1">Total Financial Exposure</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatRange(assessment.totalExposure)}
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-800 underline mt-2"
        >
          {showDetails ? 'Hide' : 'Show'} detailed breakdown
        </button>
      </div>

      {/* Breakdown Table (Expandable) */}
      {showDetails && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm text-gray-700">Filing Fees</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                  {formatRange(assessment.breakdown.filingFees)}
                </td>
              </tr>
              {assessment.breakdown.legalFees && (
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-700">Legal Fees (Optional)</td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                    {formatRange(assessment.breakdown.legalFees)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-4 py-2 text-sm text-gray-700">Other Costs</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                  {formatRange(assessment.breakdown.otherCosts)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-sm text-gray-700">Cost Award Risk</td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">
                  {formatRange(assessment.breakdown.costAwardRisk)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">Total Exposure</td>
                <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                  {formatRange(assessment.totalExposure)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Recommendations */}
      {assessment.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Recommendations:</h4>
          <ul className="space-y-1">
            {assessment.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning Messages */}
      {assessment.warningMessages.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Important Considerations:</h4>
          <ul className="space-y-1">
            {assessment.warningMessages.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
