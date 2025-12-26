interface DeadlineAlert {
  urgency: 'critical' | 'warning' | 'caution' | 'info';
  daysRemaining: number;
  limitationPeriod: {
    name: string;
    period: string;
    description: string;
    consequence: string;
    learnMoreUrl?: string;
  };
  message: string;
  actionRequired: string;
  encouragement?: string;
}

interface DeadlineAlertsProps {
  alerts: DeadlineAlert[];
}

/**
 * Display deadline alerts with urgency-based styling and encouraging messaging.
 * Focuses on being helpful, not alarming.
 */
export function DeadlineAlerts({ alerts }: DeadlineAlertsProps) {
  if (alerts.length === 0) return null;

  const urgencyStyles = {
    critical: {
      container: 'bg-red-50 border-red-300',
      icon: 'text-red-600',
      title: 'text-red-900',
      badge: 'bg-red-100 text-red-800',
    },
    warning: {
      container: 'bg-orange-50 border-orange-300',
      icon: 'text-orange-600',
      title: 'text-orange-900',
      badge: 'bg-orange-100 text-orange-800',
    },
    caution: {
      container: 'bg-yellow-50 border-yellow-300',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    info: {
      container: 'bg-blue-50 border-blue-300',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800',
    },
  };

  const urgencyIcons = {
    critical: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    caution: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Important Deadlines</h3>
      
      {alerts.map((alert, idx) => {
        const styles = urgencyStyles[alert.urgency];
        
        return (
          <div
            key={idx}
            className={`border-l-4 rounded-lg p-4 ${styles.container}`}
            role="alert"
          >
            {/* Header */}
            <div className="flex items-start mb-3">
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {urgencyIcons[alert.urgency]}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-semibold ${styles.title}`}>
                    {alert.limitationPeriod.name}
                  </h4>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${styles.badge}`}>
                    {alert.daysRemaining < 0 ? 'Overdue' : `${alert.daysRemaining} days`}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Action required */}
            <div className="ml-9 mb-3">
              <p className="text-sm font-medium text-gray-900 mb-1">What to do:</p>
              <p className="text-sm text-gray-700">{alert.actionRequired}</p>
            </div>

            {/* Encouragement */}
            {alert.encouragement && (
              <div className="ml-9 mb-3">
                <p className="text-sm italic text-gray-600">
                  💡 {alert.encouragement}
                </p>
              </div>
            )}

            {/* Details */}
            <details className="ml-9 text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                More Details
              </summary>
              <div className="mt-2 pl-4 border-l-2 border-gray-300 space-y-2">
                <div>
                  <p className="font-medium text-gray-900">Limitation Period:</p>
                  <p className="text-gray-700">{alert.limitationPeriod.period}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">What happens if you miss it:</p>
                  <p className="text-gray-700">{alert.limitationPeriod.consequence}</p>
                </div>
                {alert.limitationPeriod.learnMoreUrl && (
                  <a
                    href={alert.limitationPeriod.learnMoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
                  >
                    Read the law
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}
