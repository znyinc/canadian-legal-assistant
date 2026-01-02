import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeText } from '../utils/sanitize';
import { SettlementPathwayCard } from './SettlementPathwayCard';

export interface CaseProfile {
  empathyHook: string;
  plainSummary: string;
  keyInsight: string;
  keyInsightCaseLawSearch?: string;
  keyInsightCaseLawTooltip?: string;
  lostVsGained: { lost: string; gained: string }[];
  thingsToKnow: { title: string; detail: string; caseLawSearch?: string; tooltip?: string }[]; // exactly 3 expected
}

export interface MatterClassification {
  domain?: string;
  forum?: string;
  deadlineSummary?: string;
}

type ActionPriority = 'urgent' | 'soon' | 'when-ready';

interface ActionStep {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  timeframe: string;
}

interface SettlementPathway {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  typical: boolean;
}

interface WhatToAvoidItem {
  action: string;
  reason: string;
  severity: 'critical' | 'warning' | 'caution';
}

interface NextStepOffer {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  documentType?: string;
}

export interface ActionPlan {
  acknowledgment: string;
  immediateActions: ActionStep[];
  roleExplanation: {
    responsibilities: string[];
    whatYouAreNot: string[];
  };
  settlementPathways: SettlementPathway[];
  whatToAvoid: WhatToAvoidItem[];
  nextStepOffers: NextStepOffer[];
}

interface AdvisorResponseViewProps {
  caseProfile: CaseProfile;
  classification?: MatterClassification | null;
  actionPlan?: ActionPlan | null;
  onGenerate?: (documentType: string) => void;
  generateOptions?: { label: string; documentType: string; description?: string }[];
}

const badgeColor: Record<ActionPriority, string> = {
  urgent: 'bg-red-100 text-red-800',
  soon: 'bg-amber-100 text-amber-800',
  'when-ready': 'bg-green-100 text-green-800',
};

export const AdvisorResponseView: React.FC<AdvisorResponseViewProps> = ({
  caseProfile,
  classification,
  actionPlan,
  onGenerate,
  generateOptions,
}) => {
  const grouped = useMemo(() => {
    const initial = { urgent: [] as ActionStep[], soon: [] as ActionStep[], 'when-ready': [] as ActionStep[] };
    if (!actionPlan) return initial;
    return actionPlan.immediateActions.reduce((acc, step) => {
      if (acc[step.priority]) {
        acc[step.priority].push(step);
      }
      return acc;
    }, initial);
  }, [actionPlan]);

  const navigate = useNavigate();

  const CaseLawLink: React.FC<{ label: string; query: string; tooltip?: string; className?: string }> = ({
    label,
    query,
    tooltip,
    className,
  }) => (
    <button
      className={className || 'text-blue-700 hover:text-blue-800 underline'}
      title={tooltip || 'Open related case law'}
      onClick={() => navigate(`/caselaw?query=${encodeURIComponent(query)}`)}
    >
      {safeText(label)}
    </button>
  );

  const pathwayText = useMemo(() => {
    const forumName = classification?.forum ? safeText(classification.forum) : 'Primary forum';
    return `flowchart TD
  A[You are here] --> B[Send Demand / Notice]
  B -->|Response?| C[Negotiate Settlement]
  C --> D[Settlement ✓]
  B -->|No/Denied| E[Get Legal Help]
  E --> F[File Claim (${forumName})]
  F --> G[Present Evidence]
  G --> H[Judgment/Settlement]
`;
  }, [classification]);

  return (
    <div className="space-y-4">

      {/* 1. Empathetic hook */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        {safeText(caseProfile.empathyHook)}
      </div>

      {/* 2. Plain English summary */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Situation in Plain English</h2>
        <p className="text-gray-800 leading-relaxed">{safeText(caseProfile.plainSummary)}</p>
      </div>

      {/* 3. Key insight */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-semibold text-amber-900">Key Insight</h3>
          {caseProfile.keyInsightCaseLawSearch && (
            <CaseLawLink
              label="View related case law"
              query={caseProfile.keyInsightCaseLawSearch}
              tooltip={caseProfile.keyInsightCaseLawTooltip}
              className="text-xs text-blue-700 hover:text-blue-800 underline"
            />
          )}
        </div>
        <p className="text-amber-900 text-sm leading-snug">{safeText(caseProfile.keyInsight)}</p>
      </div>

      {/* 4. Situation comparison table */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">What You Lost vs What You May Have Gained</h3>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="grid grid-cols-2 bg-gray-50 text-gray-700 text-sm font-medium">
            <div className="px-4 py-2 border-r border-gray-200">What You Lost</div>
            <div className="px-4 py-2">What You May Have Gained</div>
          </div>
          {caseProfile.lostVsGained.map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 text-sm border-t border-gray-200">
              <div className="px-4 py-2 border-r border-gray-200 text-gray-800">{safeText(row.lost)}</div>
              <div className="px-4 py-2 text-gray-800">{safeText(row.gained)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Things to know (exactly 3) */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">The Three Things You Need to Know</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800">
          {caseProfile.thingsToKnow.slice(0, 3).map((item, idx) => (
            <li key={idx}>
              {item.caseLawSearch ? (
                <button
                  className="font-semibold text-blue-700 hover:text-blue-800 underline"
                  title={item.tooltip || 'Open related case law'}
                  onClick={() => navigate(`/caselaw?query=${encodeURIComponent(item.caseLawSearch || '')}`)}
                >
                  {safeText(item.title)}
                </button>
              ) : (
                <span className="font-semibold text-gray-900">{safeText(item.title)}</span>
              )}{' '}
              <span className="text-gray-800">{safeText(item.detail)}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 6. Action timeline grouped by urgency */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">What to Do Now</h3>
        <div className="space-y-4">
          {(['urgent', 'soon', 'when-ready'] as const).map((bucket) => (
            <div key={bucket}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColor[bucket]}`}>
                  {bucket === 'urgent' ? 'Do Today' : bucket === 'soon' ? 'This Week' : "When You're Ready"}
                </span>
              </div>
              <div className="space-y-2">
                {grouped[bucket].map((step, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-gray-50">
                    <p className="font-semibold text-gray-900 mb-1">{safeText(step.title)}</p>
                    <p className="leading-snug">{safeText(step.description)}</p>
                    <p className="text-xs text-gray-600 mt-1">{safeText(step.timeframe)}</p>
                  </div>
                ))}
                {grouped[bucket].length === 0 && (
                  <p className="text-xs text-gray-500">No steps here right now.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Visual pathway */}
      {actionPlan && actionPlan.settlementPathways && actionPlan.settlementPathways.length > 0 ? (
        <SettlementPathwayCard
          pathways={actionPlan.settlementPathways.map((p: any) => ({
            name: p.title,
            description: p.description,
            pros: p.pros,
            cons: p.cons,
            isTypical: p.typical,
          }))}
          domain={classification?.domain || 'civil'}
        />
      ) : (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Pathway at a Glance</h3>
          <pre className="bg-gray-50 text-gray-800 text-xs rounded-lg p-3 overflow-x-auto border border-gray-200" aria-label="pathway-diagram">
{pathwayText}
          </pre>
        </div>
      )}

      {/* 8. What not to do */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">What Not to Do</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
          {(actionPlan?.whatToAvoid || []).map((item, idx) => (
            <li key={idx}>
              <span className="font-semibold">{safeText(item.action)}</span>{' '}
              <span className="text-gray-700">{safeText(item.reason)}</span>
              <span className="ml-2 text-xs text-gray-500">({item.severity})</span>
            </li>
          ))}
          {(!actionPlan || actionPlan.whatToAvoid.length === 0) && (
            <li className="text-xs text-gray-500">No major pitfalls noted right now.</li>
          )}
        </ul>
      </div>

      {/* 9. Action buttons */}
      {generateOptions && generateOptions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Ready to Take Action?</h3>
          <div className="flex flex-wrap gap-3">
            {generateOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onGenerate?.(opt.documentType)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {safeText(opt.label)}
              </button>
            ))}
          </div>
          {generateOptions.some((o) => o.description) && (
            <ul className="mt-3 text-xs text-gray-600 space-y-1">
              {generateOptions.map((opt, idx) => (
                opt.description ? <li key={idx}><span className="font-medium">{safeText(opt.label)}:</span> {safeText(opt.description)}</li> : null
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 10. Footer disclaimer */}
      <div className="text-xs text-gray-600 text-center py-2">
        Legal information only. Not legal advice.
      </div>
    </div>
  );
};

export default AdvisorResponseView;
