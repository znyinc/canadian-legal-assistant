import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

interface YourRoleExplainerProps {
  roleExplanation: {
    youAre: string[];
    youAreNot: string[];
  };
}

/**
 * Clarifies the user's role in the legal process.
 * Addresses common misconceptions and empowers users with clear role definition.
 */
export const YourRoleExplainer: React.FC<YourRoleExplainerProps> = ({
  roleExplanation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-start justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex gap-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Role in This Process</h2>
            <p className="text-sm text-gray-600 mt-1">
              Here's what to expect and what you're responsible for
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 flex-shrink-0 mt-1 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
          {/* You Are */}
          <div>
            <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              You ARE
            </h3>
            <ul className="space-y-2">
              {roleExplanation.youAre.map((role, idx) => (
                <li key={idx} className="text-gray-700 text-sm">
                  <span className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{role}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* You Are Not */}
          <div>
            <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
              You are NOT
            </h3>
            <ul className="space-y-2">
              {roleExplanation.youAreNot.map((notRole, idx) => (
                <li key={idx} className="text-gray-700 text-sm">
                  <span className="flex gap-2">
                    <span className="text-orange-600 font-bold">✕</span>
                    <span>{notRole}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4">
            <p className="text-sm text-blue-900">
              <strong>Key takeaway:</strong> Understand your role so you can prepare effectively.
              This will help you know what documents to gather, who to contact, and when to seek
              professional help.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
