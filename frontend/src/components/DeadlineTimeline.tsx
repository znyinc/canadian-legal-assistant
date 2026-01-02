import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface Deadline {
  id: string;
  name: string;
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'caution' | 'info';
  description: string;
  consequence?: string;
  action?: string;
}

interface DeadlineTimelineProps {
  deadlines: Deadline[];
}

const urgencyConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  warning: { color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  caution: { color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  info: { color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
};

export function DeadlineTimeline({ deadlines }: DeadlineTimelineProps) {
  const [expandedDeadline, setExpandedDeadline] = useState<string | null>(null);

  if (deadlines.length === 0) return null;

  // Sort by days remaining
  const sortedDeadlines = [...deadlines].sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Important Deadlines
      </h2>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>

          {/* Deadline markers */}
          <div className="relative flex justify-between items-start pt-2">
            {sortedDeadlines.map((deadline) => {
              const config = urgencyConfig[deadline.urgency];
              const isExpanded = expandedDeadline === deadline.id;

              return (
                <div key={deadline.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Marker dot */}
                  <button
                    onClick={() => setExpandedDeadline(isExpanded ? null : deadline.id)}
                    className={`w-4 h-4 rounded-full ${config.color} border-4 border-white shadow-md hover:scale-125 transition-transform relative z-10`}
                    aria-label={`View ${deadline.name} details`}
                  ></button>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-semibold ${config.textColor}`}>
                      {deadline.daysRemaining} days
                    </p>
                    <p className="text-xs text-gray-600 mt-1 max-w-24">{deadline.name}</p>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`mt-4 p-3 rounded-lg border ${config.bgColor} ${config.borderColor} max-w-xs text-left`}>
                      <p className="text-sm text-gray-800 mb-2">{deadline.description}</p>
                      {deadline.action && (
                        <p className="text-xs text-gray-700 font-medium">→ {deadline.action}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: Vertical Cards */}
      <div className="md:hidden space-y-3">
        {sortedDeadlines.map((deadline) => {
          const config = urgencyConfig[deadline.urgency];
          const isExpanded = expandedDeadline === deadline.id;

          return (
            <button
              key={deadline.id}
              onClick={() => setExpandedDeadline(isExpanded ? null : deadline.id)}
              className={`w-full text-left p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                  <div>
                    <p className={`font-semibold ${config.textColor}`}>
                      {deadline.daysRemaining} days
                    </p>
                    <p className="text-sm text-gray-700">{deadline.name}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-sm text-gray-800 mb-2">{deadline.description}</p>
                  {deadline.action && (
                    <p className="text-xs text-gray-700 font-medium">→ {deadline.action}</p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
