import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface GuidanceStep {
  step: 'acknowledge' | 'orient' | 'prioritize' | 'guide' | 'prepare' | 'offer';
  title: string;
  content: string;
  expandable?: boolean;
  subItems?: Array<{
    label: string;
    detail: string;
    icon?: string;
  }>;
  estimatedTime?: string;
  urgencyLevel?: 'critical' | 'warning' | 'info';
}

interface GuidanceNarrativeProps {
  steps: GuidanceStep[];
  classification: {
    domain: string;
    jurisdiction: string;
    pillar: string;
  };
  onActionClick?: (action: string) => void;
}

const stepColors = {
  acknowledge: 'border-l-4 border-blue-500',
  orient: 'border-l-4 border-blue-400',
  prioritize: 'border-l-4 border-amber-500',
  guide: 'border-l-4 border-green-500',
  prepare: 'border-l-4 border-purple-500',
  offer: 'border-l-4 border-indigo-500',
};

const stepNumbers = {
  acknowledge: '1',
  orient: '2',
  prioritize: '3',
  guide: '4',
  prepare: '5',
  offer: '6',
};

export const GuidanceNarrative: React.FC<GuidanceNarrativeProps> = ({
  steps,
  classification,
  onActionClick,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepKey: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepKey)) {
      newExpanded.delete(stepKey);
    } else {
      newExpanded.add(stepKey);
    }
    setExpandedSteps(newExpanded);
  };

  const getUrgencyIcon = (level?: string) => {
    switch (level) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white">
      {/* Expert-friend introduction */}
      <div className="mb-8 pb-8">
        <p className="text-lg text-gray-900 leading-relaxed">
          I understand what you're dealing with. Let me walk you through this step by step so you know exactly what comes next.
        </p>
        <p className="text-sm text-gray-600 mt-3">
          <span className="font-medium">{classification.domain}</span> • 
          <span className="ml-2">{classification.jurisdiction}</span>
        </p>
      </div>

      {/* Guidance steps */}
      <div className="space-y-6">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.step);
          const stepNum = stepNumbers[step.step];

          return (
            <div
              key={step.step}
              className={`${stepColors[step.step]} bg-gray-50 rounded-lg p-6 transition-all`}
            >
              {/* Step header */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-300 font-bold text-gray-700">
                    {stepNum}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                      {step.estimatedTime && (
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {step.estimatedTime}
                        </p>
                      )}
                    </div>
                    {step.urgencyLevel && (
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {step.urgencyLevel === 'critical' && (
                          <span className="px-2 py-1 rounded bg-red-100 text-red-800">CRITICAL</span>
                        )}
                        {step.urgencyLevel === 'warning' && (
                          <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">URGENT</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step content */}
              <div className="ml-14 mt-4">
                <p className="text-gray-800 leading-relaxed text-sm">{step.content}</p>

                {/* Expandable sub-items */}
                {step.subItems && step.subItems.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show details ({step.subItems.length})
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 pt-3 border-t border-gray-200">
                        {step.subItems.map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="text-gray-400 mt-0.5">
                              {item.icon || '•'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                              <div className="text-gray-700 text-sm mt-1">{item.detail}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Natural next steps (not buttons, flowing) */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-700 mb-4">
          <span className="font-medium">What happens next?</span> I can help you with specific documents, build an evidence checklist, or explore different options in more detail. Just let me know what would be most helpful right now.
        </p>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => onActionClick?.('generate-document')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Generate documents
          </button>
          <button
            onClick={() => onActionClick?.('build-timeline')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            Build timeline
          </button>
          <button
            onClick={() => onActionClick?.('explore-options')}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            Compare options
          </button>
        </div>
      </div>

      {/* Disclaimer footer */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-gray-700">
        <p>
          <span className="font-medium">Important:</span> This is legal information only, not legal advice. 
          Every situation is unique. Consider speaking with a lawyer to discuss your specific circumstances.
        </p>
      </div>
    </div>
  );
};

export default GuidanceNarrative;
