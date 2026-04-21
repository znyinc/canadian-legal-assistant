import { useEffect, useMemo, useState } from 'react';
import {
  api,
  DecisionGate,
  DecisionGateResult,
  WorkflowArtifact,
  WorkflowDefinition,
  WorkflowResearchResponse,
  WorkflowRun,
} from '../services/api';
import { safeText, safeURL } from '../utils/sanitize';

interface WorkflowPageProps {
  matterId: string;
}

function PhaseCard({
  phase,
  run,
  onGenerate,
  generatingStepId,
}: {
  phase: WorkflowDefinition['phases'][number];
  run: WorkflowRun;
  onGenerate: (stepId: string) => Promise<void>;
  generatingStepId: string | null;
}) {
  const stateByStep = new Map(run.stepStates.map((state) => [state.stepId, state]));
  const artifactsByStep = new Map<string, WorkflowArtifact[]>();

  run.artifacts.forEach((artifact) => {
    const current = artifactsByStep.get(artifact.stepId) || [];
    current.push(artifact);
    artifactsByStep.set(artifact.stepId, current);
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{phase.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{phase.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
          phase.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : phase.status === 'in-progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {phase.status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {phase.steps.map((step) => {
          const stepState = stateByStep.get(step.id);
          const stepArtifacts = artifactsByStep.get(step.id) || [];

          return (
            <div key={step.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{step.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Artifact: <span className="font-medium">{step.artifactType}</span>
                    {stepState?.lastGeneratedAt && ` • Updated ${new Date(stepState.lastGeneratedAt).toLocaleString()}`}
                  </p>
                </div>
                <button
                  onClick={() => void onGenerate(step.id)}
                  disabled={generatingStepId === step.id}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {generatingStepId === step.id ? 'Generating...' : stepArtifacts.length > 0 ? 'Refresh' : 'Generate'}
                </button>
              </div>

              {stepArtifacts.length > 0 && (
                <div className="mt-3 space-y-3">
                  {stepArtifacts.map((artifact) => (
                    <article key={artifact.id} className="rounded-lg border border-blue-100 bg-white p-3">
                      <p className="text-sm font-semibold text-gray-900">{artifact.title}</p>
                      <p className="mt-1 text-sm text-gray-700">{artifact.summary}</p>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium text-blue-700">View artifact</summary>
                        <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-800">
                          {artifact.content}
                        </pre>
                        {artifact.verifiedResources.length > 0 && (
                          <div className="mt-3 rounded border border-green-200 bg-green-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Verified Files & Links</p>
                            <div className="mt-2 space-y-2 text-xs text-gray-700">
                              {artifact.verifiedResources.map((resource, index) => {
                                const safeResourceUrl = safeURL(resource.url) || '#';
                                return (
                                <div key={`${artifact.id}-${resource.id || index}`} className="rounded bg-white px-3 py-2">
                                  <a
                                    href={safeResourceUrl}
                                    target={resource.kind === 'link' ? '_blank' : undefined}
                                    rel={resource.kind === 'link' ? 'noopener noreferrer' : undefined}
                                    className="font-medium text-blue-700 hover:underline"
                                  >
                                    {resource.title}
                                  </a>
                                  <p className="mt-1">
                                    {resource.kind === 'file' ? 'Verified file' : 'Official link'} • {resource.sourceLabel} • retrieved {resource.retrievalDate}
                                  </p>
                                  {resource.note && <p className="mt-1 text-gray-600">{resource.note}</p>}
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {artifact.citations.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-gray-600">
                            {artifact.citations.map((citation, index) => {
                              const safeCitationUrl = safeURL(citation.url) || '#';
                              return (
                              <a
                                key={`${artifact.id}-${index}-${citation.label}`}
                                href={safeCitationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-700 hover:underline"
                              >
                                {citation.label} • {citation.source} • retrieved {citation.retrievalDate}
                              </a>
                              );
                            })}
                          </div>
                        )}
                      </details>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function GateCard({
  gate,
  result,
  onAssess,
  isAssessing,
}: {
  gate: DecisionGate;
  result?: DecisionGateResult;
  onAssess: (gateId: string, answers: Record<string, string>) => Promise<void>;
  isAssessing: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{gate.title}</h3>
          <p className="mt-1 text-sm text-gray-600">Triggered after {gate.triggerPhaseId}</p>
        </div>
        {result && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            result.outcome === 'proceed'
              ? 'bg-green-100 text-green-800'
              : result.outcome === 'pause'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {result.outcome}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {gate.questions.map((question, index) => (
          <label key={question} className="block">
            <span className="mb-1 block text-sm font-medium text-gray-800">{index + 1}. {question}</span>
            <textarea
              value={answers[`q${index + 1}`] || ''}
              onChange={(event) => setAnswers((current) => ({ ...current, [`q${index + 1}`]: event.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Record your assessment..."
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        {result ? (
          <p className="text-sm text-gray-700">{result.rationale}</p>
        ) : (
          <p className="text-sm text-gray-500">Complete the gate to force a proceed / pause / stop decision.</p>
        )}
        <button
          onClick={() => void onAssess(gate.id, answers)}
          disabled={isAssessing}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300"
        >
          {isAssessing ? 'Assessing...' : 'Assess Gate'}
        </button>
      </div>

      {result?.scorecard && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Readiness Score</span>
            <span className={`text-sm font-bold ${
              result.scorecard.overall >= 75 ? 'text-green-700'
              : result.scorecard.overall >= 50 ? 'text-yellow-700'
              : 'text-red-700'
            }`}>{result.scorecard.overall}/100</span>
          </div>
          {result.scorecard.items.map((item) => (
            <div key={item.label} className="mb-1">
              <div className="mb-0.5 flex justify-between text-xs text-gray-600">
                <span>{item.label}</span><span>{item.score}</span>
              </div>
              <progress
                className={`h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 ${
                  item.score >= 75
                    ? '[&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500'
                    : item.score >= 50
                    ? '[&::-webkit-progress-value]:bg-yellow-500 [&::-moz-progress-bar]:bg-yellow-500'
                    : '[&::-webkit-progress-value]:bg-red-400 [&::-moz-progress-bar]:bg-red-400'
                }`}
                max={100}
                value={item.score}
              />
            </div>
          ))}
          <p className="mt-2 text-xs italic text-gray-500">{result.scorecard.summary}</p>
        </div>
      )}
    </section>
  );
}

export default function WorkflowPage({ matterId }: WorkflowPageProps) {
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState<WorkflowResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generatingStepId, setGeneratingStepId] = useState<string | null>(null);
  const [assessingGateId, setAssessingGateId] = useState<string | null>(null);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState('');

  const copySafeLink = async (url: string) => {
    const safe = safeURL(url);
    if (!safe) return;
    try {
      await navigator.clipboard.writeText(safe);
    } catch {
      // Clipboard access can fail in non-secure contexts; ignore silently.
    }
  };

  const gateResults = useMemo(() => new Map((run?.gateResults || []).map((item) => [item.gateId, item])), [run]);

  const loadWorkflow = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getWorkflow(matterId);
      setDefinition(result.definition);
      setRun(result.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkflow();
  }, [matterId]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const result = await api.startWorkflow(matterId);
      setDefinition(result.definition);
      setRun(result.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    } finally {
      setStarting(false);
    }
  };

  const handleGenerate = async (stepId: string) => {
    setGeneratingStepId(stepId);
    setError('');
    try {
      const result = await api.generateWorkflowStep(matterId, stepId);
      setRun(result.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workflow artifact');
    } finally {
      setGeneratingStepId(null);
    }
  };

  const handleAssess = async (gateId: string, answers: Record<string, string>) => {
    setAssessingGateId(gateId);
    setError('');
    try {
      const result = await api.assessWorkflowGate(matterId, gateId, answers);
      setRun(result.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assess gate');
    } finally {
      setAssessingGateId(null);
    }
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setResearching(true);
    setError('');
    try {
      const result = await api.runWorkflowResearch(matterId, researchQuery.trim());
      const sanitizedResult: WorkflowResearchResponse = {
        ...result,
        citations: (result.citations || []).map((citation) => ({
          ...citation,
          url: safeURL(citation.url) || '#',
        })),
        verifiedResources: (result.verifiedResources || []).map((resource) => ({
          ...resource,
          url: safeURL(resource.url) || '#',
        })),
      };
      setResearchResult(sanitizedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run workflow research');
    } finally {
      setResearching(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg bg-white p-6 shadow">Loading step-by-step plan...</div>;
  }

  if (!definition || !run) {
    return (
      <div className="space-y-4">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">Step-by-Step Plan</h2>
          <p className="mt-2 text-sm text-gray-600">
            Start a guided plan with milestones, deadlines, research notes, and decision checkpoints.
          </p>
          <button
            onClick={() => void handleStart()}
            disabled={starting}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {starting ? 'Starting...' : 'Start Plan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}

      <section className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Your Step-by-Step Plan</h2>
            <p className="mt-1 text-sm text-gray-700">{definition.summary}</p>
            <p className="mt-2 text-sm text-gray-600">
              Track: <span className="font-medium">{run.track}</span> • Current phase: <span className="font-medium">{run.currentPhaseId}</span>
            </p>
          </div>
          <button
            onClick={() => void handleStart()}
            disabled={starting}
            className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:bg-gray-100"
          >
            {starting ? 'Refreshing...' : 'Refresh Plan'}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-red-900">Risk Notice</h3>
            <p className="mt-2 text-sm text-red-800">{run.riskNotice}</p>
            {run.escalationFlags.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-red-800">
                {run.escalationFlags.map((flag) => (
                  <li key={flag} className="rounded bg-white/70 px-3 py-2">{flag}</li>
                ))}
              </ul>
            )}
          </section>

          {definition.phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              run={run}
              onGenerate={handleGenerate}
              generatingStepId={generatingStepId}
            />
          ))}

          {definition.gates.map((gate) => (
            <GateCard
              key={gate.id}
              gate={gate}
              result={gateResults.get(gate.id)}
              onAssess={handleAssess}
              isAssessing={assessingGateId === gate.id}
            />
          ))}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Deadlines</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {run.deadlineSummary.map((item) => (
                <li key={item} className="rounded bg-gray-50 px-3 py-2">{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Cost Exposure</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {run.costExposureSummary.map((item) => (
                <li key={item} className="rounded bg-gray-50 px-3 py-2">{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Research</h3>
            <textarea
              value={researchQuery}
              onChange={(event) => setResearchQuery(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask for Ontario civil procedure, Rule 49, limitation, discovery, costs..."
            />
            <button
              onClick={() => void handleResearch()}
              disabled={researching || !researchQuery.trim()}
              className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:bg-gray-300"
            >
              {researching ? 'Researching...' : 'Run Research'}
            </button>

            {researchResult && (
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>{safeText(researchResult.narrative)}</p>
                {researchResult.verifiedResources?.length > 0 && (
                  <div className="rounded border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Verified Files & Links</p>
                    <div className="mt-2 space-y-2 text-xs text-gray-700">
                      {researchResult.verifiedResources.map((resource, index: number) => {
                        return (
                          <div key={`${resource.id || 'resource'}-${index}`} className="rounded bg-white px-3 py-2">
                            <button
                              type="button"
                              onClick={() => void copySafeLink(resource.url)}
                              className="font-medium text-blue-700 hover:underline"
                              title="Copy link"
                            >
                              {safeText(resource.title)}
                            </button>
                            <p className="mt-1">
                              {resource.kind === 'file' ? 'Verified file' : 'Official link'} • {safeText(resource.sourceLabel)} • retrieved {safeText(resource.retrievalDate)}
                            </p>
                            {resource.note && <p className="mt-1 text-gray-600">{safeText(resource.note)}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  {researchResult.citations.map((citation, index: number) => {
                    return (
                      <button
                        type="button"
                        key={`citation-${index}-${citation.label || 'source'}`}
                        onClick={() => void copySafeLink(citation.url)}
                        className="block text-blue-700 hover:underline"
                        title="Copy citation link"
                      >
                        {safeText(citation.label)} • {safeText(citation.source)} • retrieved {safeText(citation.retrievalDate)}
                      </button>
                    );
                  })}
                </div>
                {(researchResult.bundle?.notes?.length ?? 0) > 0 && (
                  <div className="rounded bg-yellow-50 p-3 text-xs text-yellow-800">
                    {safeText((researchResult.bundle?.notes || []).join(' '))}
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
