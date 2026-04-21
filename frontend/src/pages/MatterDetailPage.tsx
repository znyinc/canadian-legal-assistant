import { useState, useEffect, useMemo } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { api, Matter } from '../services/api';
import { safeText } from '../utils/sanitize';
import EvidencePage from './EvidencePage';
import DocumentsPage from './DocumentsPage';
import WorkflowPage from './WorkflowPage';
import OverviewTab from '../components/OverviewTab';
import GuidanceNarrative from '../components/GuidanceNarrative';

interface StrategicBriefing {
  assumption: string;
  whatMattersLegally: string[];
  issueBuckets: string[];
  pivotalQuestion: string;
  practicalOptions: Array<{
    title: string;
    whenItFits: string;
    tradeoff: string;
  }>;
  nextSteps24to72h: string[];
  uncertainty: string[];
}

interface HandoffContext {
  source?: string;
  strategicBriefing?: StrategicBriefing | null;
  transcript?: Array<{
    type?: 'system' | 'user' | 'assistant';
    content?: string;
  }>;
  likelyTrack?: string | null;
  evidenceChecklist?: string[];
  enabled?: boolean;
}

interface MatterPreflightContext {
  summary?: string;
  directAnswer?: string;
  likelyTrack?: string | null;
  evidenceChecklist?: string[];
  source?: string;
  model?: string;
  confidence?: number;
  reviewRecommended?: boolean;
  routeDecision?: {
    lane?: 'fast-extract' | 'deep-reason' | 'fallback-local' | string;
    provider?: string;
    model?: string;
    decisionReason?: string;
    fallbackCause?: string;
  };
}

function parseMatterMetadata(metadata?: string | null): any {
  if (!metadata) {
    return null;
  }

  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}

function extractStoredHandoff(metadata: any): HandoffContext | null {
  const entries = Array.isArray(metadata?.structuredAnswers) ? metadata.structuredAnswers : [];
  const handoffEntry = entries.find((entry: any) => entry?.kind === 'conversational-handoff');
  return handoffEntry?.data || null;
}

function extractStoredPreflight(metadata: any): MatterPreflightContext | null {
  const entries = Array.isArray(metadata?.structuredAnswers) ? metadata.structuredAnswers : [];
  const preflightEntry = entries.find((entry: any) => entry?.kind === 'matter-preflight');
  return preflightEntry?.data || null;
}

function buildGuidanceSteps(
  handoff: HandoffContext | null,
  classification: any,
  actionPlan: any,
  forumMap: any,
) {
  if (!classification || !actionPlan) {
    return [];
  }

  const strategicBriefing = handoff?.strategicBriefing;
  const primaryAction = actionPlan.immediateActions?.[0];
  const settlementPathways = actionPlan.settlementPathways || [];
  const documentOffers = actionPlan.nextStepOffers || [];
  const primaryUrgencyLevel: 'critical' | 'warning' | 'info' = primaryAction?.priority === 'urgent'
    ? 'critical'
    : primaryAction?.priority === 'soon'
      ? 'warning'
      : 'info';

  return [
    {
      step: 'acknowledge' as const,
      title: 'What I Understand So Far',
      content: actionPlan.acknowledgment || strategicBriefing?.assumption || `I’m reading this as a ${classification.domain} matter in ${classification.jurisdiction}.`,
    },
    {
      step: 'orient' as const,
      title: 'Why This Matters',
      content: strategicBriefing?.whatMattersLegally?.join(' ') || actionPlan.roleExplanation?.summary || 'The immediate legal path depends on the forum, the urgency, and the evidence you can organize now.',
      expandable: Boolean(strategicBriefing?.issueBuckets?.length),
      subItems: (strategicBriefing?.issueBuckets || []).map((item) => ({
        label: item,
        detail: 'This is one of the issue buckets affecting the path forward.',
      })),
    },
    {
      step: 'prioritize' as const,
      title: 'What To Do First',
      content: primaryAction
        ? `${primaryAction.title}. ${primaryAction.description}`
        : 'Start with the most urgent evidence preservation and deadline-driven steps.',
      estimatedTime: primaryAction?.timeframe,
      urgencyLevel: primaryUrgencyLevel,
      expandable: Boolean(actionPlan.immediateActions?.length),
      subItems: (actionPlan.immediateActions || []).map((item: any) => ({
        label: item.title,
        detail: `${item.description} ${item.timeframe ? `Timeline: ${item.timeframe}.` : ''}`.trim(),
      })),
    },
    {
      step: 'guide' as const,
      title: 'Likely Path From Here',
      content: handoff?.likelyTrack || settlementPathways?.[0]?.description || strategicBriefing?.pivotalQuestion || 'The next legal path depends on whether the facts support settlement, tribunal steps, or court action.',
      expandable: Boolean(strategicBriefing?.practicalOptions?.length || settlementPathways.length),
      subItems: [
        ...(strategicBriefing?.practicalOptions || []).map((option) => ({
          label: option.title,
          detail: `${option.whenItFits} Trade-off: ${option.tradeoff}`,
        })),
        ...settlementPathways.slice(0, 3).map((pathway: any) => ({
          label: pathway.title,
          detail: pathway.description,
        })),
      ],
    },
    {
      step: 'prepare' as const,
      title: 'What To Gather Before You Move',
      content: handoff?.evidenceChecklist?.length
        ? 'These records will make the next steps much stronger.'
        : 'Gather the documents, messages, photos, and records that support your timeline and losses.',
      expandable: Boolean(handoff?.evidenceChecklist?.length || strategicBriefing?.nextSteps24to72h?.length),
      subItems: [
        ...(handoff?.evidenceChecklist || []).map((item) => ({
          label: item,
          detail: 'Bring this into your evidence workspace next.',
        })),
        ...(strategicBriefing?.nextSteps24to72h || []).map((item) => ({
          label: item,
          detail: 'Recommended immediate next-step from the intake briefing.',
        })),
      ],
    },
    {
      step: 'offer' as const,
      title: 'What The App Can Do Next',
      content: forumMap?.primaryForum?.name
        ? `Your likely forum is ${forumMap.primaryForum.name}. From here, the workspace can move you into evidence and documents, with guided planning available later if you need a more procedural path.`
        : 'From here, the workspace can help you organize evidence and generate documents, with guided planning available later if you need a more procedural path.',
      expandable: Boolean(documentOffers.length),
      subItems: documentOffers.map((offer: any) => ({
        label: offer.title,
        detail: offer.description,
      })),
    },
  ];
}

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [forumMap, setForumMap] = useState<any>(null);
  // Removed unused state variables per action-first UX restructure
  // const [pillarExplanation, setPillarExplanation] = useState<any>(null);
  // const [pillarMatches, setPillarMatches] = useState<string[] | null>(null);
  // const [pillarAmbiguous, setPillarAmbiguous] = useState<boolean>(false);
  // const [deadlineAlerts, setDeadlineAlerts] = useState<any[] | null>(null);
  // const [uplBoundaries, setUplBoundaries] = useState<any | null>(null);
  // const [adviceRedirect, setAdviceRedirect] = useState<any | null>(null);
  // const [sandboxPlan, setSandboxPlan] = useState<any | null>(null);
  // const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState('');
  const [generatingForm7A, setGeneratingForm7A] = useState(false);
  const [showFirstRunHandoff, setShowFirstRunHandoff] = useState(false);
  const navigate = useNavigate();
  const metadata = useMemo(() => parseMatterMetadata(matter?.metadata), [matter?.metadata]);
  const routeHandoff = ((location.state as { handoff?: HandoffContext } | null)?.handoff) || null;
  const storedHandoff = useMemo(() => extractStoredHandoff(metadata), [metadata]);
  const storedPreflight = useMemo(() => extractStoredPreflight(metadata), [metadata]);
  const handoffContext = routeHandoff || storedHandoff;

  const actionPlan = classification?.actionPlan || null;
  const guidanceSteps = useMemo(
    () => buildGuidanceSteps(handoffContext, classification, actionPlan, forumMap),
    [handoffContext, classification, actionPlan, forumMap],
  );

  useEffect(() => {
    if (id) {
      loadMatter();
    }
  }, [id]);

  useEffect(() => {
    if (!id || !handoffContext || guidanceSteps.length === 0) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(`matter-handoff-seen:${id}`) !== '1') {
        setShowFirstRunHandoff(true);
      }
    } catch {
      setShowFirstRunHandoff(true);
    }
  }, [id, handoffContext, guidanceSteps.length]);

  const loadMatter = async () => {
    if (!id) return;

    try {
      const data = await api.getMatter(id);
      setMatter(data);

      if (data.classification) {
        const c = JSON.parse(data.classification);
        setClassification(c);
        // Removed setter calls for unused state variables
        // if (c.pillarExplanation) setPillarExplanation(c.pillarExplanation);
        // if (Array.isArray(c.pillarMatches)) setPillarMatches(c.pillarMatches);
        // if (c.pillarAmbiguous) setPillarAmbiguous(!!c.pillarAmbiguous);
        // if (Array.isArray(c.deadlineAlerts)) setDeadlineAlerts(c.deadlineAlerts);
        // if (c.uplBoundaries) setUplBoundaries(c.uplBoundaries);
        // if (c.adviceRedirect) setAdviceRedirect(c.adviceRedirect);
        // if (c.sandboxPlan) setSandboxPlan(c.sandboxPlan);
        // if (c.journey) setJourney(c.journey);
      }
      if (data.forumMap) {
        setForumMap(JSON.parse(data.forumMap));
      }

      // Auto-classify if not already classified
      if (!data.classification || !data.forumMap) {
        await handleClassify();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matter');
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!id) return;
    
    setClassifying(true);
    try {
      const result = await api.classifyMatter(id);
      const classificationWithAlerts = {
        ...result.classification,
        ...(result.deadlineAlerts ? { deadlineAlerts: result.deadlineAlerts } : {}),
      };
      setClassification(classificationWithAlerts);
      setForumMap(result.forumMap);
      // Removed setter calls for unused state variables (pillar, journey, etc. now in classification object)
      // if (result.pillarExplanation) setPillarExplanation(result.pillarExplanation);
      // if (Array.isArray(result.pillarMatches)) setPillarMatches(result.pillarMatches);
      // if (typeof result.pillarAmbiguous !== 'undefined') setPillarAmbiguous(!!result.pillarAmbiguous);
      // if (Array.isArray(result.deadlineAlerts)) setDeadlineAlerts(result.deadlineAlerts);
      // if (result.uplBoundaries) setUplBoundaries(result.uplBoundaries);
      // if (result.adviceRedirect) setAdviceRedirect(result.adviceRedirect);
      // if (result.sandboxPlan) setSandboxPlan(result.sandboxPlan);
      // if (result.journey) setJourney(result.journey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setClassifying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading matter...</div>;
  }

  if (error || !matter) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error || 'Matter not found'}</p>
      </div>
    );
  }

  const isOverviewPage = location.pathname === `/matters/${id}` || location.pathname === `/matters/${id}/`;
  const isWorkflowPage = location.pathname.includes('/workflow');

  const handleGenerateForm7A = async () => {
    if (!id) return;
    setGeneratingForm7A(true);
    try {
      await api.generateDocuments(id, undefined, ['civil/small_claims_form7a']);
      // navigate to documents tab to let user download
      navigate(`/matters/${id}/documents`);
    } catch (err) {
      console.error('Generate Form 7A failed', err);
      alert('Failed to generate Form 7A');
    } finally {
      setGeneratingForm7A(false);
    }
  };

  const handleGenerateDocument = async (documentType: string) => {
    if (!id) return;
    try {
      if (documentType === 'complete_package') {
        await api.generateDocuments(id);
      } else {
        await api.generateDocuments(id, undefined, [documentType]);
      }
      navigate(`/matters/${id}/documents`);
    } catch (err) {
      console.error('Generate document failed', err);
      alert('Failed to generate document');
    }
  };

  const dismissHandoff = () => {
    if (id) {
      try {
        window.sessionStorage.setItem(`matter-handoff-seen:${id}`, '1');
      } catch {
        // Ignore storage failures and just hide the handoff in local state.
      }
    }

    setShowFirstRunHandoff(false);
  };

  const handleNarrativeAction = async (action: string) => {
    dismissHandoff();

    if (!id) {
      return;
    }

    if (action === 'generate-document') {
      const defaultOffer = actionPlan?.nextStepOffers?.[0];
      if (defaultOffer?.documentType || defaultOffer?.id) {
        await handleGenerateDocument(defaultOffer.documentType || defaultOffer.id);
        return;
      }

      navigate(`/matters/${id}/documents`);
      return;
    }

    if (action === 'build-timeline') {
      navigate(`/matters/${id}/evidence`);
      return;
    }

    if (action === 'open-documents') {
      navigate(`/matters/${id}/documents`);
      return;
    }

    if (action === 'open-guided-plan') {
      navigate(`/matters/${id}/workflow`);
      return;
    }

    navigate(`/matters/${id}`);
  };

  return (
    <div>
      {/* Matter Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
            {matter.domain}
          </span>
          <span className="text-sm text-gray-500">{matter.province}</span>
          {classification && (
            <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
              Classified
            </span>
          )}
        </div>
        <p className="text-gray-900 mb-2">{safeText(matter.description)}</p>
        <p className="text-sm text-gray-500">
          Created {new Date(matter.createdAt).toLocaleDateString()}
        </p>

        {/* Quick action for civil matters: Generate Form 7A */}
        {classification?.domain === 'civil-negligence' && (
          <div className="mt-4">
            <button
              onClick={handleGenerateForm7A}
              disabled={generatingForm7A}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {generatingForm7A ? 'Generating Form 7A...' : 'Generate Form 7A'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4" aria-label="Matter details navigation">
          <Link
            to={`/matters/${id}`}
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isOverviewPage
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </Link>
          <Link
            to={`/matters/${id}/evidence`}
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/evidence')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Evidence
          </Link>
          <Link
            to={`/matters/${id}/documents`}
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/documents')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Documents
          </Link>
          <Link
            to={`/matters/${id}/workflow`}
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isWorkflowPage
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Guided Plan
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route
          index
          element={
            <div className="space-y-4">
              {(!classification || !actionPlan) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 mb-3">Classification pending. Run it to unlock tailored next steps.</p>
                  <button
                    onClick={handleClassify}
                    disabled={classifying}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                      {classifying ? 'Classifying...' : 'Classify matter'}
                  </button>
                </div>
              )}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-emerald-900 font-medium mb-2">Record integrity and auditability</p>
                <p className="text-sm text-emerald-800 mb-3">
                  Evidence files are tracked with hashes and upload metadata, and key actions are logged in the audit trail. You can export a full case package at any time.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 transition-colors"
                >
                  Open Audit and Export Controls
                </Link>
              </div>
              {storedPreflight && (
                <div className={`rounded-lg border p-4 ${storedPreflight.reviewRecommended || storedPreflight.routeDecision?.lane === 'deep-reason'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-sky-50 border-sky-200'}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className={`text-sm font-medium mb-1 ${storedPreflight.reviewRecommended || storedPreflight.routeDecision?.lane === 'deep-reason'
                        ? 'text-amber-800'
                        : 'text-sky-800'}`}>
                        Preflight review summary
                      </p>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {storedPreflight.routeDecision?.lane === 'deep-reason'
                          ? 'This matter was escalated before the workspace was created.'
                          : 'This matter was normalized during intake before the workspace was created.'}
                      </h2>
                    </div>
                    {storedPreflight.routeDecision?.lane && (
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${storedPreflight.routeDecision.lane === 'deep-reason'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-sky-100 text-sky-900'}`}>
                        {storedPreflight.routeDecision.lane}
                      </span>
                    )}
                  </div>

                  {storedPreflight.summary && (
                    <p className="text-sm text-gray-900 mb-3">{safeText(storedPreflight.summary)}</p>
                  )}

                  <div className="grid gap-3 md:grid-cols-2 mb-3">
                    <div className="rounded-lg bg-white/70 p-3 border border-white/60">
                      <p className="text-xs font-medium text-gray-600 mb-1">Why it was escalated</p>
                      <p className="text-sm text-gray-900">
                        {storedPreflight.routeDecision?.decisionReason || (
                          storedPreflight.reviewRecommended
                            ? 'The intake analysis found enough uncertainty or complexity that the summary needed review before the workspace opened.'
                            : 'The intake analysis normalized the story before the workspace was created.'
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/70 p-3 border border-white/60">
                      <p className="text-xs font-medium text-gray-600 mb-1">Routing details</p>
                      <p className="text-sm text-gray-900">
                        Confidence: {typeof storedPreflight.confidence === 'number' ? `${Math.round(storedPreflight.confidence)}%` : 'Not captured'}
                      </p>
                      {(storedPreflight.routeDecision?.provider || storedPreflight.model) && (
                        <p className="text-xs text-gray-600 mt-1">
                          {storedPreflight.routeDecision?.provider ? `Provider: ${storedPreflight.routeDecision.provider}` : ''}
                          {storedPreflight.routeDecision?.provider && storedPreflight.model ? ' • ' : ''}
                          {storedPreflight.model ? `Model: ${storedPreflight.model}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {storedPreflight.likelyTrack && (
                    <p className="text-sm text-gray-800 mb-3">
                      <span className="font-medium">Likely track:</span> {safeText(storedPreflight.likelyTrack)}
                    </p>
                  )}

                  {storedPreflight.evidenceChecklist && storedPreflight.evidenceChecklist.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Evidence flagged during intake</p>
                      <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1">
                        {storedPreflight.evidenceChecklist.slice(0, 5).map((item) => (
                          <li key={item}>{safeText(item)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {showFirstRunHandoff && guidanceSteps.length > 0 && classification && (
                <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-6">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">First-run guided handoff</p>
                      <h2 className="text-xl font-semibold text-gray-900">Start with the conversational summary, then move into the workspace.</h2>
                    </div>
                    <button
                      onClick={dismissHandoff}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Hide handoff
                    </button>
                  </div>
                  <GuidanceNarrative
                    steps={guidanceSteps}
                    classification={{
                      domain: classification.domain,
                      jurisdiction: classification.jurisdiction,
                      pillar: classification.pillar || 'general',
                    }}
                    onActionClick={handleNarrativeAction}
                  />
                </div>
              )}
              <OverviewTab
                classification={classification}
                forumMap={forumMap}
                classifying={classifying}
                onClassify={handleClassify}
                pillarExplanation={classification?.pillarExplanation}
                pillarMatches={classification?.pillarMatches}
                pillarAmbiguous={classification?.pillarAmbiguous}
                journey={classification?.journey}
                deadlineAlerts={classification?.deadlineAlerts}
                uplBoundaries={classification?.uplBoundaries}
                onGenerateDocument={handleGenerateDocument}
              />
            </div>
          }
        />
        <Route path="evidence" element={<EvidencePage matterId={id!} />} />
        <Route path="documents" element={<DocumentsPage matterId={id!} />} />
        <Route path="workflow" element={<WorkflowPage matterId={id!} />} />
      </Routes>
    </div>
  );
}
