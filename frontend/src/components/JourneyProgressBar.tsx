import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface JourneyProgressBarProps {
  percentComplete: number;
  currentStage: string;
  steps?: Array<{
    heading: string;
    description: string;
    status: 'complete' | 'current' | 'upcoming';
  }>;
}

// Color gradient based on progress percentage
const getProgressColor = (percent: number) => {
  if (percent >= 75) return 'bg-gradient-to-r from-green-500 to-emerald-600';
  if (percent >= 50) return 'bg-gradient-to-r from-blue-500 to-cyan-600';
  if (percent >= 25) return 'bg-gradient-to-r from-yellow-500 to-amber-600';
  return 'bg-gradient-to-r from-orange-500 to-red-600';
};

export function JourneyProgressBar({ percentComplete, currentStage, steps }: JourneyProgressBarProps) {
  const [expanded, setExpanded] = useState(false);
  const progressColor = getProgressColor(percentComplete);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                {currentStage}
              </span>
              <span className={`text-sm font-bold transition-colors duration-300 ${
                percentComplete >= 75 ? 'text-green-600' :
                percentComplete >= 50 ? 'text-blue-600' :
                percentComplete >= 25 ? 'text-amber-600' :
                'text-orange-600'
              }`}>
                {Math.round(percentComplete)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${progressColor} transition-all duration-700 ease-out rounded-full relative`}
                style={{ width: `${percentComplete}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 ml-3 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && steps && steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          {steps.map((step, index) => {
            const statusColors = {
              complete: {
                bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
                border: 'border-green-300',
                badge: 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-md',
                text: 'text-green-800'
              },
              current: {
                bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
                border: 'border-blue-400',
                badge: 'bg-gradient-to-r from-blue-500 to-cyan-600 shadow-lg ring-2 ring-blue-300',
                text: 'text-blue-900'
              },
              upcoming: {
                bg: 'bg-gray-50',
                border: 'border-gray-300',
                badge: 'bg-gray-400',
                text: 'text-gray-700'
              }
            };
            
            const colors = statusColors[step.status];
            
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${
                  colors.bg
                } ${
                  colors.border
                } ${
                  step.status === 'current' ? 'transform scale-105 shadow-lg' : 'hover:shadow-md'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300 ${
                    colors.badge
                  } ${
                    step.status === 'current' ? 'animate-pulse' : ''
                  }`}
                >
                  {step.status === 'complete' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${colors.text}`}>
                    {step.heading}
                    {step.status === 'current' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full animate-pulse">
                        IN PROGRESS
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
