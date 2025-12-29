interface PathwayComparisonProps {
  comparison: {
    pathways: Array<{
      name: string;
      costEstimate: { min: number; max: number };
      timeframe: string;
      pros: string[];
      cons: string[];
      feeWaiver: boolean;
    }>;
    recommendation: string;
  };
}

/**
 * Side-by-side comparison table of alternative legal pathways.
 * Shows cost ranges, timeframes, pros/cons, fee waiver availability, and recommendation.
 */
export function PathwayComparison({ comparison }: PathwayComparisonProps) {
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">🔀 Pathway Comparison</h3>

      {/* Recommendation Banner */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">💡</span>
          <div>
            <div className="text-sm font-medium text-blue-900 mb-1">Recommendation</div>
            <p className="text-sm text-blue-800">{comparison.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pathway</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Estimate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeframe</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Waiver?</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pros & Cons</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comparison.pathways.map((pathway, idx) => {
              const isFree = pathway.costEstimate.min === 0 && pathway.costEstimate.max === 0;
              
              return (
                <tr key={idx} className={isFree ? 'bg-green-50' : ''}>
                  {/* Pathway Name */}
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {pathway.name}
                    {isFree && <span className="ml-2 text-green-600 text-xs">✓ FREE</span>}
                  </td>

                  {/* Cost Estimate */}
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">
                      {isFree ? 'Free' : formatRange(pathway.costEstimate)}
                    </div>
                  </td>

                  {/* Timeframe */}
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pathway.timeframe}
                  </td>

                  {/* Fee Waiver */}
                  <td className="px-4 py-3 text-sm">
                    {isFree ? (
                      <span className="text-gray-400 text-xs">N/A</span>
                    ) : pathway.feeWaiver ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✓ Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        ✗ Not Available
                      </span>
                    )}
                  </td>

                  {/* Pros & Cons */}
                  <td className="px-4 py-3 text-xs">
                    {pathway.pros.length > 0 && (
                      <div className="mb-2">
                        <div className="font-medium text-green-700 mb-1">Pros:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {pathway.pros.map((pro, i) => (
                            <li key={i} className="text-green-600">{pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pathway.cons.length > 0 && (
                      <div>
                        <div className="font-medium text-red-700 mb-1">Cons:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {pathway.cons.map((con, i) => (
                            <li key={i} className="text-red-600">{con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-xs text-gray-600">
        <p>
          💡 <strong>Tip:</strong> Starting with a free or low-cost pathway allows you to test the strength of your case before committing to higher costs.
        </p>
      </div>
    </div>
  );
}
