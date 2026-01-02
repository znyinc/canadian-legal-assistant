import React, { useState } from 'react';
import { TrendingUp, ChevronDown, ArrowRight, Target, Scale, MessageSquare, Gavel } from 'lucide-react';

interface Pathway {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  isTypical?: boolean;
}

interface SettlementPathwayCardProps {
  pathways: Pathway[];
  domain: string;
}

// Color themes for different pathway types
const getPathwayTheme = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('negotiation') || lowerName.includes('settlement')) {
    return {
      primary: 'emerald',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300',
      text: 'text-emerald-800',
      accent: 'bg-emerald-500',
      icon: <MessageSquare className="w-5 h-5" />
    };
  }
  if (lowerName.includes('tribunal') || lowerName.includes('board')) {
    return {
      primary: 'blue',
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-800',
      accent: 'bg-blue-500',
      icon: <Scale className="w-5 h-5" />
    };
  }
  if (lowerName.includes('court') || lowerName.includes('litigation')) {
    return {
      primary: 'purple',
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      text: 'text-purple-800',
      accent: 'bg-purple-500',
      icon: <Gavel className="w-5 h-5" />
    };
  }
  if (lowerName.includes('ombudsman') || lowerName.includes('complaint')) {
    return {
      primary: 'amber',
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-800',
      accent: 'bg-amber-500',
      icon: <Target className="w-5 h-5" />
    };
  }
  return {
    primary: 'gray',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-800',
    accent: 'bg-gray-500',
    icon: <ArrowRight className="w-5 h-5" />
  };
};

/**
 * Presents settlement and resolution pathways in non-directive format.
 * Emphasizes that settlement is common and that multiple options exist.
 * Enhanced with animated color-coded visual pathway mapping.
 */
export const SettlementPathwayCard: React.FC<SettlementPathwayCardProps> = ({
  pathways,
  domain,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    pathways.findIndex((p) => p.isTypical)
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (pathways.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-600" />
        Possible Pathways
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Most {domain} cases resolve through settlement. Here are your options:
      </p>

      {/* Visual Pathway Flow Diagram */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Pathway at a Glance
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {pathways.map((pathway, idx) => {
            const theme = getPathwayTheme(pathway.name);
            const isHovered = hoveredIndex === idx;
            const isExpanded = expandedIndex === idx;
            
            return (
              <React.Fragment key={idx}>
                <div
                  className={`flex-shrink-0 transition-all duration-300 cursor-pointer transform ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                >
                  <div
                    className={`relative px-4 py-3 rounded-lg border-2 transition-all duration-300 ${
                      theme.bg
                    } ${
                      theme.border
                    } ${
                      isExpanded ? 'ring-2 ring-offset-2 ring-' + theme.primary + '-500' : ''
                    } ${
                      pathway.isTypical ? 'shadow-lg' : 'shadow'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`${theme.accent} text-white p-1.5 rounded-full transition-transform duration-300 ${
                        isHovered ? 'rotate-12' : 'rotate-0'
                      }`}>
                        {theme.icon}
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${theme.text} whitespace-nowrap`}>
                          {pathway.name}
                        </div>
                        {pathway.isTypical && (
                          <div className="text-[10px] font-bold text-green-700 animate-pulse">
                            ⭐ TYPICAL
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Animated progress indicator */}
                    <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
                      <div
                        className={`h-full ${theme.accent} transition-all duration-500 ${
                          isHovered || isExpanded ? 'w-full' : 'w-1/3'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {idx < pathways.length - 1 && (
                  <ArrowRight
                    className={`flex-shrink-0 text-gray-400 transition-all duration-300 ${
                      isHovered ? 'text-gray-700 scale-125' : 'scale-100'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {pathways.map((pathway, idx) => {
          const theme = getPathwayTheme(pathway.name);
          const isExpanded = expandedIndex === idx;
          const isHovered = hoveredIndex === idx;
          
          return (
            <div
              key={idx}
              className={`border-2 rounded-lg overflow-hidden transition-all duration-300 transform ${
                pathway.isTypical
                  ? `${theme.border} ${theme.bg} shadow-lg`
                  : `border-gray-300 hover:${theme.border} hover:shadow-md`
              } ${
                isHovered ? 'scale-[1.02]' : 'scale-100'
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                className="w-full text-left p-4 hover:opacity-90 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`${theme.accent} text-white p-1.5 rounded-full transition-transform duration-300 ${
                        isHovered ? 'rotate-12' : 'rotate-0'
                      }`}>
                        {theme.icon}
                      </div>
                      <h3 className={`font-semibold ${theme.text}`}>{pathway.name}</h3>
                      {pathway.isTypical && (
                        <span className="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded animate-pulse">
                          ⭐ TYPICAL
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-9">{pathway.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-all duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${
                      isHovered ? 'text-gray-900' : ''
                    }`}
                  />
                </div>
              </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-current border-opacity-20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Advantages:</h4>
                  <ul className="space-y-1">
                    {pathway.pros.map((pro, proIdx) => (
                      <li key={proIdx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-600 font-bold">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Considerations:</h4>
                  <ul className="space-y-1">
                    {pathway.cons.map((con, conIdx) => (
                      <li key={conIdx} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-orange-600 font-bold">-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );})}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded p-4 mt-4">
        <p className="text-sm text-gray-700">
          <strong>Remember:</strong> You control which pathway to pursue. Consult with a lawyer
          or paralegal to discuss which option best fits your situation.
        </p>
      </div>
    </div>
  );
};
