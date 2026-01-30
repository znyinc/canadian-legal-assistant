import React, { useState } from 'react';
import { Calendar, AlertTriangle, TrendingUp, Users, Lock, Settings } from 'lucide-react';

export interface DashboardMetric {
  label: string;
  value: string | number;
  status: 'success' | 'warning' | 'critical' | 'info';
  trend?: 'up' | 'down' | 'stable';
}

export interface KitProgress {
  kitId: string;
  kitName: string;
  status: 'not-started' | 'in-progress' | 'paused' | 'completed';
  progress: number; // 0-100
  deadline?: Date;
  urgency: 'critical' | 'high' | 'moderate' | 'low';
  currentStep?: number;
  totalSteps?: number;
}

export interface ProgressDashboardProps {
  activeKits: KitProgress[];
  metrics?: DashboardMetric[];
  upcomingDeadlines?: { date: Date; description: string }[];
  onKitClick?: (kitId: string) => void;
  onPauseKit?: (kitId: string) => void;
  onResumeKit?: (kitId: string) => void;
  showCoordination?: boolean;
}

const getStatusColor = (status: 'not-started' | 'in-progress' | 'paused' | 'completed') => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'not-started':
      return 'bg-gray-100 text-gray-800';
  }
};

const getUrgencyColor = (urgency: 'critical' | 'high' | 'moderate' | 'low') => {
  switch (urgency) {
    case 'critical':
      return 'bg-red-100 border-red-300';
    case 'high':
      return 'bg-orange-100 border-orange-300';
    case 'moderate':
      return 'bg-yellow-100 border-yellow-300';
    case 'low':
      return 'bg-blue-100 border-blue-300';
  }
};

const getMetricIcon = (label: string) => {
  if (label.includes('Deadline')) return <Calendar className="w-5 h-5" />;
  if (label.includes('Risk')) return <AlertTriangle className="w-5 h-5" />;
  if (label.includes('Progress')) return <TrendingUp className="w-5 h-5" />;
  if (label.includes('Participant')) return <Users className="w-5 h-5" />;
  return <Lock className="w-5 h-5" />;
};

/**
 * ProgressDashboard Component
 * Real-time tracking of multiple kit executions with deadline management
 * Features: Kit progress visualization, deadline alerts, metrics display, multi-kit coordination
 */
export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  activeKits,
  metrics = [],
  upcomingDeadlines = [],
  onKitClick,
  onPauseKit,
  onResumeKit,
  showCoordination = true,
}) => {
  const [expandedKit, setExpandedKit] = useState<string | null>(null);

  // Calculate overall statistics
  const totalKits = activeKits.length;
  const completedKits = activeKits.filter((k) => k.status === 'completed').length;
  const inProgressKits = activeKits.filter((k) => k.status === 'in-progress').length;
  const criticalDeadlines = upcomingDeadlines.filter(
    (d) => new Date(d.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  );

  // Sort kits by urgency
  const sortedKits = [...activeKits].sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  // Group deadlines
  const upcomingDates = upcomingDeadlines
    .filter((d) => new Date(d.date).getTime() > Date.now())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Progress Dashboard</h2>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{completedKits}</div>
              <div className="text-blue-100">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{inProgressKits}</div>
              <div className="text-blue-100">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalKits}</div>
              <div className="text-blue-100">Total</div>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>Overall Progress</span>
            <span className="font-bold">
              {totalKits > 0 ? Math.round((completedKits / totalKits) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-blue-300 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalKits > 0 ? Math.round((completedKits / totalKits) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Main Kit Tracking */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Kits</h3>

          {sortedKits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active kits. Select a kit to get started.</p>
            </div>
          ) : (
            sortedKits.map((kit) => (
              <div
                key={kit.kitId}
                className={`border-2 rounded-lg transition-all ${
                  expandedKit === kit.kitId ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                } ${getUrgencyColor(kit.urgency)}`}
              >
                {/* Kit Header */}
                <button
                  onClick={() => {
                    setExpandedKit(expandedKit === kit.kitId ? null : kit.kitId);
                    onKitClick?.(kit.kitId);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-opacity-75 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{kit.kitName}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(kit.status)}`}>
                          {kit.status.charAt(0).toUpperCase() + kit.status.slice(1)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              kit.progress === 100
                                ? 'bg-green-600'
                                : kit.progress >= 50
                                  ? 'bg-blue-600'
                                  : 'bg-orange-600'
                            }`}
                            style={{ width: `${kit.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                          {kit.progress}%
                        </span>
                      </div>

                      {/* Steps Info */}
                      {kit.currentStep !== undefined && kit.totalSteps !== undefined && (
                        <p className="text-sm text-gray-600">
                          Step {kit.currentStep} of {kit.totalSteps}
                        </p>
                      )}
                    </div>

                    {/* Deadline Badge */}
                    {kit.deadline && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(kit.deadline).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">Deadline</div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedKit === kit.kitId && (
                  <div className="px-4 py-4 border-t border-gray-200 bg-white">
                    <div className="space-y-3">
                      {/* Status Details */}
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">Status</h5>
                        <p className="text-sm text-gray-600">
                          {kit.status === 'completed'
                            ? 'This kit has been completed. You can review the results or archive this kit.'
                            : kit.status === 'in-progress'
                              ? 'You are currently working on this kit. Continue at your own pace.'
                              : kit.status === 'paused'
                                ? 'This kit is paused. You can resume it at any time.'
                                : 'This kit is ready to start. Click the button below to begin.'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {kit.status === 'in-progress' && onPauseKit && (
                          <button
                            onClick={() => onPauseKit(kit.kitId)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                          >
                            Pause Kit
                          </button>
                        )}
                        {kit.status === 'paused' && onResumeKit && (
                          <button
                            onClick={() => onResumeKit(kit.kitId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Resume Kit
                          </button>
                        )}
                        {kit.status === 'not-started' && onKitClick && (
                          <button
                            onClick={() => onKitClick(kit.kitId)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Start Kit
                          </button>
                        )}
                        {kit.status === 'completed' && (
                          <button
                            onClick={() => onKitClick?.(kit.kitId)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            View Results
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar: Deadlines & Metrics */}
        <div className="space-y-6">
          {/* Critical Deadlines */}
          {criticalDeadlines.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Critical Deadlines
              </h4>
              <div className="space-y-2">
                {criticalDeadlines.map((deadline, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium text-red-900">
                      {new Date(deadline.date).toLocaleDateString()}
                    </div>
                    <div className="text-red-700 text-xs">{deadline.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Deadlines
            </h4>
            {upcomingDates.length === 0 ? (
              <p className="text-sm text-gray-600">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {upcomingDates.map((deadline, idx) => (
                  <div key={idx} className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium text-gray-900">
                      {new Date(deadline.date).toLocaleDateString()}
                    </div>
                    <div className="text-gray-600 text-xs">{deadline.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics */}
          {metrics.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
              <div className="space-y-2">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      {metric.trend && (
                        <TrendingUp
                          className={`w-4 h-4 ${
                            metric.trend === 'up'
                              ? 'text-green-600'
                              : metric.trend === 'down'
                                ? 'text-red-600'
                                : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Kit Coordination Note */}
      {showCoordination && activeKits.length > 1 && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Multi-Kit Coordination:</strong> You have {activeKits.length} kits active. Consider prioritizing based on
            upcoming deadlines and urgency levels.
          </p>
        </div>
      )}
    </div>
  );
};
