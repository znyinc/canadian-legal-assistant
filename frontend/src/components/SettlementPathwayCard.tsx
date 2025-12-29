import React, { useState } from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';

interface Pathway {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  isTypical?: boolean;
}

interface SettlementPathwayCardProps {
  pathways: Pathway[];
  domain: string;
}

/**
 * Presents settlement and resolution pathways in non-directive format.
 * Emphasizes that settlement is common and that multiple options exist.
 */
export const SettlementPathwayCard: React.FC<SettlementPathwayCardProps> = ({
  pathways,
  domain,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    pathways.findIndex((p) => p.isTypical)
  );

  if (pathways.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-600" />
        Possible Pathways
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Most {domain} cases resolve through settlement. Here are your options:
      </p>

      <div className="space-y-3">
        {pathways.map((pathway, idx) => (
          <div
            key={idx}
            className={`border rounded-lg overflow-hidden transition-colors ${
              pathway.isTypical
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <button
              onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              className="w-full text-left p-4 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{pathway.name}</h3>
                    {pathway.isTypical && (
                      <span className="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded">
                        TYPICAL
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pathway.description}</p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                    expandedIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {expandedIndex === idx && (
              <div className="px-4 pb-4 border-t border-current border-opacity-20 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Advantages:</h4>
                  <ul className="space-y-1">
                    {pathway.pros.map((pro, proIdx) => (
                      <li key={proIdx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-600 font-bold">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Considerations:</h4>
                  <ul className="space-y-1">
                    {pathway.cons.map((con, conIdx) => (
                      <li key={conIdx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-orange-600 font-bold">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-4">
        <p className="text-sm text-gray-700">
          <strong>Remember:</strong> You control which pathway to pursue. Consult with a lawyer
          or paralegal to discuss which option best fits your situation.
        </p>
      </div>
    </div>
  );
};
