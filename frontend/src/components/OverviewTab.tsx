import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { safeText } from '../utils/sanitize';
import { DeadlineTimeline } from './DeadlineTimeline';
import { SituationSummaryCard } from './SituationSummaryCard';
import { JourneyProgressBar } from './JourneyProgressBar';
import { FooterDisclaimer } from './FooterDisclaimer';
import { EmpathyBoundaries } from './EmpathyBoundaries';
// import { SandboxPlanCard } from './SandboxPlanCard'; // Removed per action-first UX restructure
import {
  AcknowledgmentBanner,
  ImmediateActionsCard,
  YourRoleExplainer,
  SettlementPathwayCard,
  WhatToAvoidSection,
  NextStepsOffer,
} from './ActionPlanComponents';

// ActionPlanGenerator is from the shared library - for now, we'll import it inline or via API
// Since we can't directly import from src, we'll use the classification data we already have
type ActionPlan = any; // Will be generated server-side

export default function OverviewTab({
  classification,
  forumMap,
  classifying,
  onClassify,
  pillarExplanation,
  pillarMatches,
  pillarAmbiguous,
  journey,
  deadlineAlerts,
  uplBoundaries,
  // adviceRedirect, // Removed per action-first UX
  // sandboxPlan, // Removed per action-first UX
  onGenerateDocument,
}: {
  classification: any;
  forumMap: any;
  classifying: boolean;
  onClassify: () => void;
  pillarExplanation?: any;
  pillarMatches?: string[];
  pillarAmbiguous?: boolean;
  journey?: any;
  deadlineAlerts?: any[];
  uplBoundaries?: any;
  adviceRedirect?: any;
  sandboxPlan?: any;
  onGenerateDocument?: (documentType: string) => Promise<void>;
}) {
  const [showClassificationDetails, setShowClassificationDetails] = useState(false);
  const [showSupportingInfo, setShowSupportingInfo] = useState(false);

  const handleGenerateDocument = async (documentType: string) => {
    if (onGenerateDocument) {
      await onGenerateDocument(documentType);
    } else {
      console.log('Generate document:', documentType);
    }
  };

  // Use action plan from classification (should be generated server-side)
  const actionPlan: ActionPlan | null = useMemo(() => {
    if (!classification) return null;
    // Action plan is generated server-side and included in classification
    return classification.actionPlan || null;
  }, [classification]);

  // Fallbacks: if props are not set yet, derive from classification persisted data
  const effectiveExplanation = pillarExplanation ?? classification?.pillarExplanation;
  const effectiveMatches: string[] | undefined = pillarMatches ?? classification?.pillarMatches;
  const effectiveAmbiguous: boolean = (pillarAmbiguous ?? classification?.pillarAmbiguous) || false;

  if (classifying) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-blue-800 font-medium">🤖 AI is analyzing your matter...</p>
        </div>
        <p className="text-blue-700 text-sm mt-2">
          Classifying legal domain, identifying applicable forums, and assessing urgency.
        </p>
      </div>
    );
  }

  // Show a non-blocking banner if classification/forumMap are missing, but continue rendering overview for test stability
  const showPending = !classification || !forumMap;

  const pillarLabel = classification?.pillar ?? 'Unknown';
  const effectiveDeadlineAlerts = (deadlineAlerts || classification?.deadlineAlerts || []) as any[];
  const effectiveBoundaries = uplBoundaries || classification?.uplBoundaries;
  // const effectiveAdvice = adviceRedirect || classification?.adviceRedirect; // Removed per action-first UX
  // const effectiveSandbox = sandboxPlan || classification?.sandboxPlan; // Removed per action-first UX

  // Prepare situation summary data
  const situationSummary = useMemo(() => {
    if (!classification) return null;

    const domainLabels: Record<string, string> = {
      criminal: 'Criminal matter',
      civil: 'Civil dispute',
      legalMalpractice: 'Legal malpractice claim',
      municipalPropertyDamage: 'Municipal property damage',
      landlordTenant: 'Landlord-tenant dispute',
      employment: 'Employment issue',
      consumerProtection: 'Consumer protection matter',
    };

    const situation = domainLabels[classification.domain] || classification.domain;

    // Find most urgent deadline
    const sortedDeadlines = [...effectiveDeadlineAlerts].sort((a, b) => a.daysRemaining - b.daysRemaining);
    const primaryDeadline = sortedDeadlines[0];

    return {
      situation,
      primaryDeadline: primaryDeadline ? {
        name: primaryDeadline.limitationPeriod?.name || primaryDeadline.period?.name || 'Deadline',
        daysRemaining: primaryDeadline.daysRemaining,
        urgency: primaryDeadline.urgency,
        caseLawReferences: primaryDeadline.limitationPeriod?.caseLawReferences,
      } : undefined,
      primaryForum: forumMap?.primaryForum,
    };
  }, [classification, forumMap, effectiveDeadlineAlerts]);

  // Convert deadline alerts to timeline format
  const deadlineTimelineData = useMemo(() => {
    return effectiveDeadlineAlerts.map((alert: any) => ({
      id: alert.periodId,
      name: alert.period?.name || 'Deadline',
      daysRemaining: alert.daysRemaining,
      urgency: alert.urgency,
      description: alert.message,
      consequence: alert.period?.consequence,
      action: alert.encouragement,
    }));
  }, [effectiveDeadlineAlerts]);

  return (
    <>
      <div className="space-y-6 pb-20">
        {/* Pending banner */}
        {showPending && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 mb-4">Classification pending. This matter needs to be analyzed.</p>
            <button
              onClick={onClassify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🤖 Classify Now with AI
            </button>
          </div>
        )}

        {/* ===== ACTION-FIRST UX SECTION (Prioritized for user needs) ===== */}

        {/* 1. Empathetic Acknowledgment (2 lines max) */}
        {actionPlan && (
          <AcknowledgmentBanner
            acknowledgment={actionPlan.acknowledgment}
            domain={classification?.domain || 'civil'}
          />
        )}

        {/* 2. Situation Summary Card (compact overview) */}
        {situationSummary && (
          <SituationSummaryCard
            situation={situationSummary.situation}
            primaryDeadline={situationSummary.primaryDeadline}
            primaryForum={situationSummary.primaryForum}
          />
        )}

        {/* 3. HERO SECTION: What to Do Now */}
        {actionPlan && actionPlan.immediateActions.length > 0 && (
          <ImmediateActionsCard
            actions={actionPlan.immediateActions.map((a: any) => ({
              priority: a.priority,
              action: a.title,
              timeframe: a.timeframe,
              details: a.description,
            }))}
          />
        )}

        {/* 4. Visual Deadline Timeline */}
        {deadlineTimelineData.length > 0 && (
          <DeadlineTimeline deadlines={deadlineTimelineData} />
        )}

        {/* 5. Your Options (collapsed by default) */}
        {actionPlan && actionPlan.settlementPathways.length > 0 && (
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
        )}

        {/* 6. Journey Progress (slim progress bar) */}
        {journey && journey.steps && journey.steps.length > 0 && (
          <JourneyProgressBar
            percentComplete={journey.percentComplete || 0}
            currentStage={journey.steps.find((s: any) => s.status === 'active')?.label || 'Prepare'}
            steps={journey.steps.map((s: any) => ({
              heading: s.label,
              description: s.nextSteps?.[0] || '',
              status: s.status === 'done' ? 'complete' : s.status === 'active' ? 'current' : 'upcoming',
            }))}
          />
        )}

        {/* 7. Supporting Info (collapsed accordion) */}
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setShowSupportingInfo(!showSupportingInfo)}
            className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-semibold text-gray-900">Supporting Information</h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                showSupportingInfo ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showSupportingInfo && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
              {/* Your Role */}
              {actionPlan && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Your Role in This Process</h3>
                  <YourRoleExplainer
                    roleExplanation={{
                      youAre: actionPlan.roleExplanation.responsibilities,
                      youAreNot: actionPlan.roleExplanation.whatYouAreNot,
                    }}
                  />
                </div>
              )}

              {/* Things to Avoid */}
              {actionPlan && actionPlan.whatToAvoid.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Things to Be Careful About</h3>
                  <WhatToAvoidSection
                    warnings={actionPlan.whatToAvoid.map((w: any) => ({
                      severity: w.severity,
                      title: w.action,
                      description: w.reason,
                    }))}
                  />
                </div>
              )}

              {/* Next Steps Offers */}
              {actionPlan && actionPlan.nextStepOffers.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Document Generation</h3>
                  <NextStepsOffer
                    offers={actionPlan.nextStepOffers.map((o: any) => ({
                      label: o.title,
                      description: o.description,
                      action: 'generate' as const,
                      documentType: o.documentType,
                    }))}
                    onGenerateDocument={handleGenerateDocument}
                  />
                </div>
              )}

              {/* Forum Recommendation */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Do I Need to Go to Court?</h3>
                {forumMap && forumMap.primaryForum ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-base font-semibold text-gray-900 mb-2">
                      {forumMap.primaryForum.type === 'court'
                        ? 'Likely yes — court is the primary forum'
                        : 'Probably not — court is not the primary forum'}
                    </p>
                    <p className="text-gray-700 text-sm mb-2">
                      Primary forum: <strong>{forumMap.primaryForum.name}</strong> ({forumMap.primaryForum.type})
                    </p>
                    {forumMap.rationale && (
                      <p className="text-sm text-gray-600">{safeText(forumMap.rationale)}</p>
                    )}

                    {forumMap.alternatives && forumMap.alternatives.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300">
                        <p className="text-sm font-medium text-gray-700 mb-1">Alternative Forums:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {forumMap.alternatives.map((alt: any) => (
                            <li key={alt.id}>
                              {alt.name} ({alt.type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm">
                    No forum recommendation available yet. Classify the matter to get tailored guidance.
                  </p>
                )}
              </div>

              {/* Boundaries */}
              {effectiveBoundaries && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Information-Only Boundaries</h3>
                  <EmpathyBoundaries plan={effectiveBoundaries} />
                </div>
              )}

              {/* Classification Details */}
              {classification && (
                <div>
                  <button
                    onClick={() => setShowClassificationDetails(!showClassificationDetails)}
                    className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity mb-3"
                  >
                    <h3 className="text-base font-semibold text-gray-900">Technical Classification Details</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        showClassificationDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showClassificationDetails && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
                      <dl className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Domain</dt>
                          <dd className="text-gray-900">{classification.domain}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Sub-category</dt>
                          <dd className="text-gray-900">{classification.subCategory || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Urgency</dt>
                          <dd className="text-gray-900">{classification.urgency || 'Standard'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
                          <dd className="text-gray-900">{classification.jurisdiction}</dd>
                        </div>
                      </dl>

                      {(effectiveExplanation || (effectiveMatches && effectiveMatches.length > 0)) && (
                        <div className="p-4 bg-white rounded border border-gray-300 mt-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            Legal pillar: <span className="font-semibold text-gray-900">{pillarLabel}</span>
                          </h4>

                          {effectiveAmbiguous && effectiveMatches && effectiveMatches.length > 1 && (
                            <p className="text-sm text-red-600 mt-1">
                              Ambiguous: multiple legal pillars detected — {effectiveMatches.join(', ')}. Provide more detail for a
                              clearer classification.
                            </p>
                          )}

                          {effectiveExplanation && (
                            <>
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Burden of proof:</strong> {effectiveExplanation.burdenOfProof}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Overview:</strong> {effectiveExplanation.overview}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer (always visible) */}
      <FooterDisclaimer />
    </>
  );
};
