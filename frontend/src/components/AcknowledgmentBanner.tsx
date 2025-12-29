import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AcknowledgmentBannerProps {
  acknowledgment: string;
  domain: string;
}

/**
 * Displays empathetic acknowledgment message at top of action plan.
 * Sets tone and validates user's experience before presenting actions.
 */
export const AcknowledgmentBanner: React.FC<AcknowledgmentBannerProps> = ({
  acknowledgment,
  domain,
}) => {
  // Domain-specific styling
  const domainStyles: Record<string, { bg: string; border: string; icon: string }> = {
    criminal: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
    civil: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    employment: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
    landlordTenant: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
    municipal: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
    insurance: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  };

  const style = domainStyles[domain] || domainStyles.civil;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-6 mb-6`}>
      <div className="flex gap-4">
        <AlertCircle className={`${style.icon} flex-shrink-0 w-6 h-6 mt-1`} />
        <div className="flex-1">
          <p className="text-lg text-gray-900 leading-relaxed">{acknowledgment}</p>
        </div>
      </div>
    </div>
  );
};
