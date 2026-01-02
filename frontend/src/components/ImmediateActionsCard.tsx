import React, { useState } from 'react';
import { ChevronDown, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface ActionStep {
  priority: 'urgent' | 'soon' | 'when-ready';
  action: string;
  timeframe?: string;
  details?: string;
}

interface ImmediateActionsCardProps {
  actions: ActionStep[];
}

const PRIORITY_CONFIG = {
  urgent: {
    icon: AlertCircle,
    label: 'URGENT',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  soon: {
    icon: Clock,
    label: 'SOON',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  'when-ready': {
    icon: CheckCircle,
    label: 'WHEN READY',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

/**
 * Displays prioritized action steps organized by urgency.
 * Makes it clear what the user needs to do and when.
 */
export const ImmediateActionsCard: React.FC<ImmediateActionsCardProps> = ({
  actions,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Group actions by priority
  const priorityOrder = ['urgent', 'soon', 'when-ready'] as const;
  const groupedActions = priorityOrder.map((priority) => ({
    priority,
    items: actions.filter((a) => a.priority === priority),
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-500">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Need to Do</h2>

      <div className="space-y-6">
        {groupedActions.map(({ priority, items }) => {
          if (items.length === 0) return null;

          const config = PRIORITY_CONFIG[priority];
          const Icon = config.icon;

          return (
            <div key={priority} className="space-y-3">
              <h3 className={`text-sm font-bold ${config.color} flex items-center gap-2 uppercase tracking-wider`}>
                <Icon className="w-5 h-5" />
                {config.label}
              </h3>

              {items.map((step, idx) => {
                const globalIdx = actions.indexOf(step);
                const isExpanded = expandedIndex === globalIdx;

                return (
                  <div
                    key={idx}
                    className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-md overflow-hidden`}
                  >
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : globalIdx)}
                      className="w-full text-left p-4 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base">{step.action}</p>
                          {step.timeframe && (
                            <p className="text-sm text-gray-600 mt-1 font-medium">{step.timeframe}</p>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isExpanded && step.details && (
                      <div className="px-4 pb-4 border-t border-current border-opacity-20">
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed">{step.details}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 mt-6 italic border-t border-gray-200 pt-4">
        💡 <strong>Start with urgent items.</strong> This is your roadmap through the legal process.
      </p>
    </div>
  );
};
