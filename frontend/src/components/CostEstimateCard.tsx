import { useState } from 'react';

interface CostEstimateCardProps {
  estimate: {
    filingFee: { min: number; max: number };
    otherCosts: {
      processServer?: { min: number; max: number };
      photocopying?: { min: number; max: number };
      expertWitnesses?: { min: number; max: number };
      travelExpenses?: { min: number; max: number };
    };
    costAwardRisk: {
      risk: 'low' | 'medium' | 'high';
      range: { min: number; max: number };
      explanation: string;
    };
    totalEstimate: { min: number; max: number };
    notes: string[];
  };
}

/**
 * Displays comprehensive cost estimate with breakdown and risk factors.
 * Shows filing fees, other costs, cost award risk, and total range.
 */
export function CostEstimateCard({ estimate }: CostEstimateCardProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  const riskBadgeColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const riskBadgeText = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">💰 Cost Estimate</h3>

      {/* Total Estimate (Prominent) */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="text-sm font-medium text-blue-900 mb-1">Total Estimated Cost</div>
        <div className="text-3xl font-bold text-blue-900">
          {formatRange(estimate.totalEstimate)}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          This includes filing fees, other costs, and potential cost awards
        </p>
      </div>

      {/* Cost Award Risk Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${riskBadgeColor[estimate.costAwardRisk.risk]}`}>
          ⚠️ {riskBadgeText[estimate.costAwardRisk.risk]} Cost Award
        </span>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showBreakdown ? 'Hide' : 'Show'} breakdown
        </button>
      </div>

      {/* Breakdown (Expandable) */}
      {showBreakdown && (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Filing Fee:</span>
            <span className="font-medium text-gray-900">{formatRange(estimate.filingFee)}</span>
          </div>

          {Object.keys(estimate.otherCosts).length > 0 && (
            <>
              <div className="text-sm font-medium text-gray-700 mt-3">Other Costs:</div>
              {estimate.otherCosts.processServer && (
                <div className="flex justify-between text-sm pl-4">
                  <span className="text-gray-600">Process Server:</span>
                  <span className="text-gray-900">{formatRange(estimate.otherCosts.processServer)}</span>
                </div>
              )}
              {estimate.otherCosts.photocopying && (
                <div className="flex justify-between text-sm pl-4">
                  <span className="text-gray-600">Photocopying:</span>
                  <span className="text-gray-900">{formatRange(estimate.otherCosts.photocopying)}</span>
                </div>
              )}
              {estimate.otherCosts.expertWitnesses && (
                <div className="flex justify-between text-sm pl-4">
                  <span className="text-gray-600">Expert Witnesses:</span>
                  <span className="text-gray-900">{formatRange(estimate.otherCosts.expertWitnesses)}</span>
                </div>
              )}
              {estimate.otherCosts.travelExpenses && (
                <div className="flex justify-between text-sm pl-4">
                  <span className="text-gray-600">Travel Expenses:</span>
                  <span className="text-gray-900">{formatRange(estimate.otherCosts.travelExpenses)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200">
            <span className="text-gray-600">Cost Award Risk:</span>
            <span className="font-medium text-gray-900">{formatRange(estimate.costAwardRisk.range)}</span>
          </div>
          <p className="text-xs text-gray-600 pl-4">{estimate.costAwardRisk.explanation}</p>
        </div>
      )}

      {/* Notes */}
      {estimate.notes.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded p-3 space-y-1">
          {estimate.notes.map((note, idx) => (
            <p key={idx} className="text-xs text-gray-700">
              ℹ️ {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
