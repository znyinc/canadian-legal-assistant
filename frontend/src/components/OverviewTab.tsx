import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { safeText } from '../utils/sanitize';
import { DeadlineAlerts } from './DeadlineAlerts';
import { EmpathyBoundaries } from './EmpathyBoundaries';
import { AdviceRedirectBanner } from './AdviceRedirectBanner';
import { SandboxPlanCard } from './SandboxPlanCard';
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
  adviceRedirect,
  sandboxPlan,
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
}) {
  const [showClassificationDetails, setShowClassificationDetails] = useState(false);

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
  const effectiveAdvice = adviceRedirect || classification?.adviceRedirect;
  const effectiveSandbox = sandboxPlan || classification?.sandboxPlan;

  return (
    <div className="space-y-6">
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

      {effectiveAdvice && <AdviceRedirectBanner advice={effectiveAdvice} />}

      {effectiveBoundaries && <EmpathyBoundaries plan={effectiveBoundaries} />}

      {effectiveSandbox && <SandboxPlanCard plan={effectiveSandbox} />}

      {/* ===== ACTION-FIRST UX SECTION (re-ordered for natural flow) ===== */}

      {/* 1. Acknowledgment Banner */}
      {actionPlan && (
        <AcknowledgmentBanner
          acknowledgment={actionPlan.acknowledgment}
          domain={classification?.domain || 'civil'}
        />
      )}

      {/* 2. Immediate Actions */}
      {actionPlan && actionPlan.immediateActions.length > 0 && (
        <ImmediateActionsCard actions={actionPlan.immediateActions} />
      )}

      {/* 3. What to Avoid (pairs with immediate actions) */}
      {actionPlan && actionPlan.whatToAvoid.length > 0 && (
        <WhatToAvoidSection
          warnings={actionPlan.whatToAvoid.map((w: any) => ({
            severity: w.severity,
            title: w.action,
            description: w.reason,
          }))}
        />
      )}

      {/* 4. Next Steps Offers (follow-on actions) */}
      {actionPlan && actionPlan.nextStepOffers.length > 0 && (
        <NextStepsOffer
          offers={actionPlan.nextStepOffers.map((o: any) => ({
            label: o.title,
            description: o.description,
            action: 'generate' as const,
            documentType: o.documentType,
          }))}
        />
      )}

      {/* 5. Your Role Explainer (context after actions) */}
      {actionPlan && (
        <YourRoleExplainer
          roleExplanation={{
            youAre: actionPlan.roleExplanation.responsibilities,
            youAreNot: actionPlan.roleExplanation.whatYouAreNot,
          }}
        />
      )}

      {/* 6. Settlement Pathways (options after knowing role) */}
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

      {/* ===== SUPPORTING INFORMATION SECTION ===== */}

      {/* Deadline Alerts (timing paired close to actions) */}
      {effectiveDeadlineAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <DeadlineAlerts alerts={effectiveDeadlineAlerts} />
        </div>
      )}

      {/* Quick answer: Do I need to go to court? */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Do I need to go to court?</h2>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {forumMap && forumMap.primaryForum ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {forumMap.primaryForum.type === 'court'
                    ? 'Likely yes — court is the primary forum'
                    : 'Probably not — court is not the primary forum'}
                </p>
                <p className="text-gray-700 mb-2">
                  Primary forum: <strong>{forumMap.primaryForum.name}</strong> ({forumMap.primaryForum.type})
                </p>
                {forumMap.rationale && (
                  <p className="text-sm text-gray-600">Rationale: {safeText(forumMap.rationale)}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-700">
                No forum recommendation available yet. Classify the matter to get tailored guidance.
              </p>
            )}
          </div>
          <div className="w-48 space-y-3">
            {forumMap && forumMap.alternatives && forumMap.alternatives.length > 0 && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Alternative Forums</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {forumMap.alternatives.map((alt: any) => (
                    <li key={alt.id}>
                      {alt.name} ({alt.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {forumMap && forumMap.escalation && forumMap.escalation.length > 0 && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Escalation Path</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {forumMap.escalation.map((esc: any) => (
                    <li key={esc.id}>
                      {esc.name} ({esc.type})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Journey Tracker */}
      {journey && journey.steps && journey.steps.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Journey Tracker</h2>
            {typeof journey.percentComplete === 'number' && (
              <span className="text-sm font-medium text-gray-700">{Math.round(journey.percentComplete)}% complete</span>
            )}
          </div>
          <div className="space-y-3">
            {journey.steps.map((stage: any) => (
              <div key={stage.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                  {stage.nextSteps && stage.nextSteps.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-gray-600 mt-1 space-y-1">
                      {stage.nextSteps.slice(0, 2).map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    stage.status === 'done'
                      ? 'bg-green-100 text-green-800'
                      : stage.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {stage.status === 'done' ? 'Done' : stage.status === 'active' ? 'In progress' : 'Not started'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classification Details (Collapsed) */}
      {classification && (
        <div className="bg-white rounded-lg shadow p-6">
          <button
            onClick={() => setShowClassificationDetails(!showClassificationDetails)}
            className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-semibold text-gray-900">Technical Classification Details</h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform ${
                showClassificationDetails ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showClassificationDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
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
                <div className="p-4 bg-gray-50 rounded border border-gray-200 mt-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Legal pillar: <span className="font-semibold text-gray-900">{pillarLabel}</span>
                  </h3>

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
                      {effectiveExplanation.nextSteps && effectiveExplanation.nextSteps.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Suggested next steps</p>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {effectiveExplanation.nextSteps.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {forumMap?.rationale && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Forum Routing Rationale</h3>
                  <p className="text-gray-700 text-sm">{forumMap.rationale}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
