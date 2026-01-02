import { Clock, MapPin, Scale, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SituationSummaryCardProps {
  situation: string;
  primaryDeadline?: {
    name: string;
    daysRemaining: number;
    urgency: 'critical' | 'warning' | 'caution' | 'info';
    caseLawReferences?: Array<{
      caseName: string;
      citation: string;
      relevance: string;
      searchQuery?: string;
    }>;
  };
  primaryForum?: {
    name: string;
    type: string;
  };
  additionalItems?: Array<{
    icon: 'clock' | 'map' | 'scale' | 'info';
    label: string;
    value: string;
    subtext?: string;
    urgency?: 'critical' | 'warning' | 'caution' | 'info';
  }>;
}

const urgencyColors = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  warning: 'text-orange-600 bg-orange-50 border-orange-200',
  caution: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
};

export function SituationSummaryCard({ situation, primaryDeadline, primaryForum, additionalItems }: SituationSummaryCardProps) {
  const navigate = useNavigate();

  const handleCaseLawClick = (searchQuery?: string) => {
    if (searchQuery) {
      // Navigate to case law page with pre-filled search
      navigate(`/caselaw?query=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/caselaw');
    }
  };

  // Count total items to determine grid layout
  const baseItemCount = 1 + (primaryDeadline ? 1 : 0) + (primaryForum ? 1 : 0);
  const totalItems = baseItemCount + (additionalItems?.length || 0);
  
  // Responsive grid: 1 col on mobile, 2 cols on tablet, 3-4 cols on desktop
  const gridCols = totalItems <= 2 ? 'md:grid-cols-2' : totalItems === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
        {/* Situation */}
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Scale className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your Situation</p>
            <p className="text-sm text-gray-900 leading-snug">{situation}</p>
          </div>
        </div>

        {/* Primary Deadline */}
        {primaryDeadline && (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Key Deadline</p>
              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-sm font-medium ${urgencyColors[primaryDeadline.urgency]}`}>
                <span className="font-semibold">{primaryDeadline.daysRemaining} days</span>
                <span className="text-xs opacity-75">{primaryDeadline.name}</span>
              </div>
              
              {/* Case Law References */}
              {primaryDeadline.caseLawReferences && primaryDeadline.caseLawReferences.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600 mb-1">📚 Case Law:</p>
                  {primaryDeadline.caseLawReferences.map((ref, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCaseLawClick(ref.searchQuery)}
                      className="group flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-1"
                      title={`${ref.relevance}\n${ref.citation}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="underline">{ref.caseName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Forum */}
        {primaryForum && (
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Primary Forum</p>
              <p className="text-sm text-gray-900 font-medium">{primaryForum.name}</p>
              <p className="text-xs text-gray-600 capitalize">{primaryForum.type}</p>
            </div>
          </div>
        )}

        {/* Additional Dynamic Items */}
        {additionalItems?.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="mt-1">
              {item.icon === 'clock' && <Clock className="w-5 h-5 text-gray-600" />}
              {item.icon === 'map' && <MapPin className="w-5 h-5 text-gray-600" />}
              {item.icon === 'scale' && <Scale className="w-5 h-5 text-gray-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{item.label}</p>
              {item.urgency ? (
                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-sm font-medium ${urgencyColors[item.urgency]}`}>
                  <span>{item.value}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-900 font-medium">{item.value}</p>
              )}
              {item.subtext && <p className="text-xs text-gray-600 mt-1">{item.subtext}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
