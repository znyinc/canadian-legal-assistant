import React, { useState } from 'react';
import { ChevronRight, Zap, FileText, DollarSign, AlertCircle, Gavel } from 'lucide-react';

export interface Kit {
  id: string;
  name: string;
  description: string;
  domain: string;
  forum: string;
  icon: React.ReactNode;
  estimatedTime: string;
  complexity: 'low' | 'moderate' | 'high';
  urgency?: 'critical' | 'high' | 'moderate' | 'low';
}

export interface KitLauncherProps {
  onSelectKit: (kit: Kit) => void;
  selectedKit?: Kit;
  disabledKits?: string[];
  showProgress?: boolean;
}

const DEFAULT_KITS: Kit[] = [
  {
    id: 'rent-increase',
    name: 'Rent Increase Challenge',
    description: 'Challenge an unfair rent increase at the Landlord and Tenant Board',
    domain: 'landlordTenant',
    forum: 'Landlord and Tenant Board',
    icon: <AlertCircle className="w-6 h-6 text-blue-600" />,
    estimatedTime: '45-60 minutes',
    complexity: 'moderate',
  },
  {
    id: 'employment-termination',
    name: 'Employment Termination',
    description: 'Analyze wrongful dismissal and ESA entitlements',
    domain: 'employment',
    forum: 'Ministry of Labour / Small Claims / Superior Court',
    icon: <Zap className="w-6 h-6 text-orange-600" />,
    estimatedTime: '60-90 minutes',
    complexity: 'high',
    urgency: 'high',
  },
  {
    id: 'small-claims',
    name: 'Small Claims Preparation',
    description: 'Prepare Form 7A and organize evidence for Small Claims Court',
    domain: 'civilNegligence',
    forum: 'Small Claims Court',
    icon: <FileText className="w-6 h-6 text-green-600" />,
    estimatedTime: '90-120 minutes',
    complexity: 'moderate',
  },
  {
    id: 'motor-vehicle-accident',
    name: 'Motor Vehicle Accident',
    description: 'Navigate DC-PD vs tort claim options after an accident',
    domain: 'civilNegligence',
    forum: 'FSRA (DC-PD) / Superior Court (tort)',
    icon: <DollarSign className="w-6 h-6 text-purple-600" />,
    estimatedTime: '60-75 minutes',
    complexity: 'moderate',
  },
  {
    id: 'will-challenge',
    name: 'Will Challenge Assessment',
    description: 'Evaluate grounds for challenging a will in Superior Court',
    domain: 'civilNegligence',
    forum: 'Superior Court of Justice',
    icon: <Gavel className="w-6 h-6 text-red-600" />,
    estimatedTime: '90-120 minutes',
    complexity: 'high',
    urgency: 'critical',
  },
];

const getComplexityBadge = (complexity: 'low' | 'moderate' | 'high') => {
  switch (complexity) {
    case 'low':
      return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Low</span>;
    case 'moderate':
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Moderate</span>;
    case 'high':
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">High</span>;
  }
};

const getUrgencyBadge = (urgency?: 'critical' | 'high' | 'moderate' | 'low') => {
  if (!urgency) return null;
  switch (urgency) {
    case 'critical':
      return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded animate-pulse">Critical</span>;
    case 'high':
      return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">High</span>;
    case 'moderate':
      return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Moderate</span>;
    case 'low':
      return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Low</span>;
  }
};

/**
 * KitLauncher Component
 * Displays available decision-support kits with selection interface
 * Features: Kit browsing, progress visualization, complexity indicators, urgency badges
 */
export const KitLauncher: React.FC<KitLauncherProps> = ({
  onSelectKit,
  selectedKit,
  disabledKits = [],
  showProgress = false,
}) => {
  const [hoveredKit, setHoveredKit] = useState<string | null>(null);

  const isKitDisabled = (kitId: string) => disabledKits.includes(kitId);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Decision-Support Kits</h2>
        <p className="text-gray-600">
          Choose a kit below to get started. Each kit provides step-by-step guidance tailored to your legal situation.
        </p>
      </div>

      {/* Kit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {DEFAULT_KITS.map((kit) => {
          const isSelected = selectedKit?.id === kit.id;
          const isDisabled = isKitDisabled(kit.id);

          return (
            <button
              key={kit.id}
              onClick={() => !isDisabled && onSelectKit(kit)}
              onMouseEnter={() => setHoveredKit(kit.id)}
              onMouseLeave={() => setHoveredKit(null)}
              disabled={isDisabled}
              className={`
                relative p-4 text-left rounded-lg border-2 transition-all duration-200
                ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'}
                ${!isDisabled && hoveredKit === kit.id ? 'shadow-lg -translate-y-1' : 'shadow'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
              `}
            >
              {/* Icon */}
              <div className="mb-3 flex items-center justify-between">
                {kit.icon}
                {isSelected && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
              </div>

              {/* Kit Name */}
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{kit.name}</h3>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{kit.description}</p>

              {/* Badges */}
              <div className="space-y-2 mb-3">
                <div className="flex gap-1 flex-wrap">
                  {getComplexityBadge(kit.complexity)}
                  {getUrgencyBadge(kit.urgency)}
                </div>
                <div className="text-xs text-gray-500">⏱ {kit.estimatedTime}</div>
              </div>

              {/* Forum Indicator */}
              <div className="text-xs text-gray-600 border-t pt-2">
                <span className="font-medium">Forum:</span> {kit.forum.split('/')[0].trim()}
              </div>

              {/* Select Indicator */}
              {!isDisabled && (
                <div className={`absolute top-2 right-2 transition-opacity ${hoveredKit === kit.id ? 'opacity-100' : 'opacity-0'}`}>
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress Section */}
      {showProgress && selectedKit && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Kit Progress</h3>
          <p className="text-sm text-gray-600 mb-4">
            You've selected <span className="font-semibold">{selectedKit.name}</span>. This kit typically takes
            <span className="font-semibold"> {selectedKit.estimatedTime}</span> to complete.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-0 transition-all duration-500" style={{ width: '0%' }} />
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Important:</strong> These kits provide legal information only. They are not a substitute for legal advice from a licensed lawyer or paralegal.
        </p>
      </div>
    </div>
  );
};
