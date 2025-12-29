import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface Warning {
  severity: 'critical' | 'warning' | 'caution';
  title: string;
  description: string;
}

interface WhatToAvoidSectionProps {
  warnings: Warning[];
}

const SEVERITY_CONFIG = {
  critical: {
    label: 'CRITICAL',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    icon: 'text-red-600',
  },
  warning: {
    label: 'WARNING',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    icon: 'text-orange-600',
  },
  caution: {
    label: 'CAUTION',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    icon: 'text-yellow-600',
  },
};

/**
 * Highlights critical things to avoid or be careful about.
 * Presented as guidance, not restrictions—empowering users to make informed decisions.
 */
export const WhatToAvoidSection: React.FC<WhatToAvoidSectionProps> = ({ warnings }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (warnings.length === 0) {
    return null;
  }

  // Sort by severity
  const sortedWarnings = [...warnings].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, caution: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-red-600" />
        Things to Be Careful About
      </h2>

      <div className="space-y-3">
        {sortedWarnings.map((warning, idx) => {
          const config = SEVERITY_CONFIG[warning.severity];
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className={`${config.bgColor} ${config.borderColor} border rounded-lg overflow-hidden`}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full text-left p-4 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{warning.title}</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-current border-opacity-20">
                  <p className="text-sm text-gray-700 mt-3">{warning.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
        <p className="text-sm text-blue-900">
          <strong>Why this matters:</strong> These items can significantly affect your case
          outcome. If you're uncertain about what to do, consult with a lawyer or paralegal
          before taking action.
        </p>
      </div>
    </div>
  );
};
