import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConversationalInterface } from '../components/ConversationalInterface';
import { api, NuanceChatContext } from '../services/api';

function normalizeMatterDomain(domain?: string): string {
  const normalized = (domain || '').trim();
  const aliasMap: Record<string, string> = {
    'civil-negligence': 'civilNegligence',
    civilnegligence: 'civilNegligence',
    'landlord-tenant': 'landlordTenant',
    landlordtenant: 'landlordTenant',
    'municipal-property-damage': 'municipalPropertyDamage',
    municipalpropertydamage: 'municipalPropertyDamage',
    'consumer-protection': 'consumerProtection',
    consumerprotection: 'consumerProtection',
    'human-rights': 'humanRights',
    humanrights: 'humanRights',
    'legal-malpractice': 'legalMalpractice',
    legalmalpractice: 'legalMalpractice',
    'estate-succession': 'estateSuccession',
    estatesuccession: 'estateSuccession',
    'tree-damage': 'municipalPropertyDamage',
  };

  return aliasMap[normalized.toLowerCase()] || normalized || 'other';
}

function normalizeProvince(jurisdiction?: string): string {
  const value = (jurisdiction || '').trim();
  if (!value || value.toLowerCase().includes('ontario')) {
    return 'ON';
  }
  return value;
}

export default function NuanceChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [context, setContext] = useState<NuanceChatContext | null>(null);
  const [activePanel, setActivePanel] = useState<'read' | 'next' | 'change' | 'detail'>('read');
  const [isCreatingMatter, setIsCreatingMatter] = useState(false);
  const [createError, setCreateError] = useState('');
  const autoSeededRef = useRef(false);

  const seedDraft = useMemo(() => {
    const state = location.state as {
      seedDraft?: {
        description?: string;
        domain?: string;
        jurisdiction?: string;
      };
    } | null;

    return state?.seedDraft || null;
  }, [location.state]);

  const initialPrompt = seedDraft?.description
    ? `Talk me through what happened. I will keep the route practical, flag the next useful action, and show what still needs confirmation. I can already see this draft: ${seedDraft.description}`
    : 'Talk me through what happened. I will keep the route practical, show what matters now, and point out what still needs confirmation.';

  const handleMessageSend = async (message: string) => {
    const response = await api.sendNuanceChatMessage({
      message,
      history,
    });

    setContext(response.context);
    handleContextUpdate(response.context);

    setHistory((prev) => [
      ...prev,
      { role: 'user', content: message },
      { role: 'assistant', content: response.message },
    ]);

    return response.message;
  };

  useEffect(() => {
    if (autoSeededRef.current || !seedDraft?.description?.trim()) {
      return;
    }

    autoSeededRef.current = true;

    void handleMessageSend(seedDraft.description.trim());
  }, [seedDraft?.description]);

  const handleContextUpdate = (nextContext: NuanceChatContext) => {
    setContext(nextContext);
  };

  const panelTitle =
    activePanel === 'read'
      ? 'Best Current Read'
      : activePanel === 'next'
        ? 'What To Do Next'
        : activePanel === 'change'
          ? 'What Could Change The Path'
          : 'One Detail Still Needed';

  const panelDescription =
    activePanel === 'read'
      ? 'Use this to check the app’s current route, summary, and confidence without losing your place in the chat.'
      : activePanel === 'next'
        ? 'Keep the next practical actions visible while you continue refining the story.'
        : activePanel === 'change'
          ? 'Watch the facts that would redirect the route so you know what clarification matters most.'
          : 'Stay focused on the single missing detail and the evidence that helps answer it.';

  const handleCreateMatter = async () => {
    if (!context) {
      return;
    }

    setIsCreatingMatter(true);
    setCreateError('');

    try {
      const createdMatter = await api.createMatter({
        description: context.importPayload.description || context.incidentSummary,
        province: normalizeProvince(context.importPayload.jurisdiction || context.jurisdiction),
        domain: normalizeMatterDomain(context.importPayload.domain || context.domain),
        structuredAnswers: [
          {
            kind: 'semantic-analyzer-import',
            data: {
              source: context.source,
              model: context.model,
              confidence: context.confidence,
              incidentSummary: context.incidentSummary,
              likelyTrack: context.likelyTrack,
              remediationPattern: context.remediationPattern,
              missingFacts: context.missingFacts,
              evidenceChecklist: context.evidenceChecklist,
              directAnswer: context.directAnswer,
              immediateActions: context.immediateActions,
              escalationCriteria: context.escalationCriteria,
              singleNextQuestion: context.singleNextQuestion,
              routeDecision: (context as any).routeDecision,
              transcript: history,
            },
          },
        ],
        variables: {
          semanticAnalyzerImported: true,
          semanticSource: context.source,
          semanticModel: context.model || '',
          semanticConfidence: context.confidence,
          semanticUrgency: context.urgency || 'medium',
          autoProceed: true,
        },
      });

      navigate(`/matters/${createdMatter.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create matter from semantic analyzer output');
    } finally {
      setIsCreatingMatter(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <button
            onClick={() => navigate('/matters')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to matters
          </button>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">Semantic Intake</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            This is the primary intake path. It sends your facts through the semantic analyzer and LiteLLM-backed model route, then creates the matter workspace directly from that output.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateMatter}
            disabled={!context?.readyToImport || isCreatingMatter}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCreatingMatter ? 'Creating Workspace...' : 'Create Matter Workspace'}
          </button>
        </div>
      </div>

      {createError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {createError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,380px)] xl:items-start">
        <ConversationalInterface
          kitName="Guided chat"
          initialPrompt={initialPrompt}
          onMessageSend={handleMessageSend}
          onContextUpdate={handleContextUpdate}
          placeholder="Describe what happened, what you know, and what still feels unclear..."
          className="h-[calc(100vh-15rem)] min-h-[680px]"
        />

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2 text-gray-900">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Intake Insights</h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">Keep the route visible without letting the side panel take over the intake workspace.</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-blue-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Domain</p>
                  <p className="mt-1 text-gray-900">{context?.domain || 'Working it out'}</p>
                </div>
                <div className="rounded-xl bg-blue-50 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Confidence</p>
                  <p className="mt-1 text-gray-900">{context ? `${Math.round(context.confidence)}%` : 'Pending'}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 px-5 py-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'read', label: 'Current Read' },
                  { key: 'next', label: 'Next Step' },
                  { key: 'change', label: 'Path Shift' },
                  { key: 'detail', label: 'Missing Detail' },
                ].map((panel) => (
                  <button
                    key={panel.key}
                    onClick={() => setActivePanel(panel.key as 'read' | 'next' | 'change' | 'detail')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${activePanel === panel.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">{panelTitle}</h3>
              <p className="mt-1 text-sm text-gray-600">{panelDescription}</p>

              {activePanel === 'read' && (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <p className="rounded-xl bg-blue-50 px-3 py-3 text-gray-800">
                    {context?.directAnswer || 'As you chat, the app will keep tightening the most practical reading of the situation.'}
                  </p>
                  <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                    <p><span className="font-medium text-gray-900">Working summary:</span> {context?.incidentSummary || 'The working summary will appear here.'}</p>
                    <p><span className="font-medium text-gray-900">Jurisdiction:</span> {context?.jurisdiction || 'Pending'}</p>
                    <p><span className="font-medium text-gray-900">Source:</span> {context ? (context.source === 'llm' ? `Semantic analyzer via LiteLLM${context.model ? ` (${context.model})` : ''}` : 'Fallback summary') : 'Pending'}</p>
                    {context?.routeDecision && (
                      <p><span className="font-medium text-gray-900">Model route:</span> {context.routeDecision.lane} via {context.routeDecision.provider}</p>
                    )}
                  </div>
                </div>
              )}

              {activePanel === 'next' && (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <ul className="space-y-2">
                    {(context?.immediateActions || []).map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-xl bg-amber-50 px-3 py-3">{item}</li>
                    ))}
                    {!context?.immediateActions?.length && (
                      <li className="rounded-xl bg-gray-50 px-3 py-3 text-gray-500">The next practical steps will show up here.</li>
                    )}
                  </ul>
                  {context?.likelyTrack && (
                    <p className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">{context.likelyTrack}</p>
                  )}
                </div>
              )}

              {activePanel === 'change' && (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <ul className="space-y-2">
                    {(context?.escalationCriteria || []).map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-3 py-3">{item}</li>
                    ))}
                    {!context?.escalationCriteria?.length && (
                      <li className="rounded-xl bg-gray-50 px-3 py-3 text-gray-500">Escalation signals will show up here.</li>
                    )}
                  </ul>
                  {context?.remediationPattern && (
                    <p className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-700">{context.remediationPattern}</p>
                  )}
                </div>
              )}

              {activePanel === 'detail' && (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <p className="rounded-xl bg-amber-50 px-3 py-3 text-gray-900">
                    {context?.singleNextQuestion || context?.missingFacts?.[0] || 'The next clarifying question will appear here.'}
                  </p>
                  <div>
                    <p className="font-medium text-gray-900">What to gather</p>
                    <ul className="mt-2 space-y-2">
                      {(context?.evidenceChecklist || []).map((item, index) => (
                        <li key={`${item}-${index}`} className="rounded-xl bg-gray-50 px-3 py-3">{item}</li>
                      ))}
                      {!context?.evidenceChecklist?.length && (
                        <li className="rounded-xl bg-gray-50 px-3 py-3 text-gray-500">Evidence and document hints will show up here.</li>
                      )}
                    </ul>
                  </div>
                  <p className="text-xs text-gray-500">
                    {context?.conciseDisclaimer || 'This is legal information only, not legal advice.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
