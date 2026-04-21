import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface GuidanceStep {
  step: 'acknowledge' | 'orient' | 'prioritize' | 'guide' | 'prepare' | 'offer';
  title: string;
  content: string;
  expandable?: boolean;
  subItems?: Array<{
    label: string;
    detail: string;
    icon?: string;
  }>;
  estimatedTime?: string;
  urgencyLevel?: 'critical' | 'warning' | 'info';
}

interface GuidanceNarrativeProps {
  steps: GuidanceStep[];
  classification: {
    domain: string;
    jurisdiction: string;
    pillar: string;
  };
  onActionClick?: (action: string) => void;
}

const stepNumbers: Record<GuidanceStep['step'], string> = {
  acknowledge: '1',
  orient: '2',
  prioritize: '3',
  guide: '4',
  prepare: '5',
  offer: '6',
};

const stepThemes: Record<GuidanceStep['step'], { card: string; badge: string; panel: string }> = {
  acknowledge: {
    card: 'border-sky-200 bg-sky-50/70 hover:border-sky-300',
    badge: 'bg-sky-100 text-sky-800',
    panel: 'border-sky-200 bg-sky-50/50',
  },
  orient: {
    card: 'border-cyan-200 bg-cyan-50/70 hover:border-cyan-300',
    badge: 'bg-cyan-100 text-cyan-800',
    panel: 'border-cyan-200 bg-cyan-50/50',
  },
  prioritize: {
    card: 'border-amber-200 bg-amber-50/80 hover:border-amber-300',
    badge: 'bg-amber-100 text-amber-900',
    panel: 'border-amber-200 bg-amber-50/60',
  },
  guide: {
    card: 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800',
    panel: 'border-emerald-200 bg-emerald-50/50',
  },
  prepare: {
    card: 'border-violet-200 bg-violet-50/70 hover:border-violet-300',
    badge: 'bg-violet-100 text-violet-800',
    panel: 'border-violet-200 bg-violet-50/50',
  },
  offer: {
    card: 'border-indigo-200 bg-indigo-50/70 hover:border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-800',
    panel: 'border-indigo-200 bg-indigo-50/50',
  },
};

function getDefaultSelectedStep(steps: GuidanceStep[]): GuidanceStep['step'] | null {
  return steps.find((step) => step.step === 'prioritize')?.step || steps[0]?.step || null;
}

function getStepActions(step: GuidanceStep): Array<{ label: string; action: string; primary?: boolean }> {
  switch (step.step) {
    case 'prioritize':
      return [
        { label: 'Open evidence and timeline', action: 'build-timeline', primary: true },
        { label: 'Open documents', action: 'open-documents' },
      ];
    case 'prepare':
      return [
        { label: 'Go to evidence workspace', action: 'build-timeline', primary: true },
        { label: 'Open documents', action: 'open-documents' },
      ];
    case 'offer':
      return [
        { label: 'Open documents', action: 'generate-document', primary: true },
        { label: 'Open guided plan', action: 'open-guided-plan' },
      ];
    default:
      return [
        { label: 'Go to evidence workspace', action: 'build-timeline', primary: true },
        { label: 'Open documents', action: 'open-documents' },
      ];
  }
}

export const GuidanceNarrative: React.FC<GuidanceNarrativeProps> = ({
  steps,
  classification,
  onActionClick,
}) => {
  const [selectedStepKey, setSelectedStepKey] = useState<GuidanceStep['step'] | null>(() => getDefaultSelectedStep(steps));
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setSelectedStepKey(getDefaultSelectedStep(steps));
    setShowDetails(false);
  }, [steps]);

  const selectedStep = useMemo(
    () => steps.find((step) => step.step === selectedStepKey) || steps[0] || null,
    [selectedStepKey, steps],
  );

  if (!selectedStep) {
    return null;
  }

  const selectedTheme = stepThemes[selectedStep.step];
  const actions = getStepActions(selectedStep);

  return (
    <div className="max-w-4xl mx-auto bg-white space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">First-Run Guided Handoff</p>
            <h3 className="mt-2 text-2xl font-semibold text-gray-900">Pick the part you want to act on first</h3>
            <p className="mt-2 text-sm text-gray-700">
              You do not need to read everything in order. Start with the card that matches what you need right now.
            </p>
          </div>
          <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-800">
            {classification.domain} • {classification.jurisdiction}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((step) => {
          const isSelected = step.step === selectedStep.step;
          const theme = stepThemes[step.step];

          return (
            <button
              key={step.step}
              type="button"
              onClick={() => setSelectedStepKey(step.step)}
              className={`rounded-2xl border p-4 text-left transition-all ${theme.card} ${
                isSelected ? 'ring-2 ring-offset-1 ring-blue-300 shadow-sm' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${theme.badge}`}>
                  {stepNumbers[step.step]}
                </div>
                {step.urgencyLevel && step.urgencyLevel !== 'info' && (
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${theme.badge}`}>
                    {step.urgencyLevel === 'critical' ? 'Critical' : 'Urgent'}
                  </span>
                )}
              </div>
              <h4 className="mt-4 text-sm font-semibold text-gray-900">{step.title}</h4>
              <p className="mt-2 text-sm text-gray-700">{step.content}</p>
            </button>
          );
        })}
      </div>

      <div className={`rounded-2xl border p-5 shadow-sm ${selectedTheme.panel}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedTheme.badge}`}>
              Step {stepNumbers[selectedStep.step]}
            </div>
            <h4 className="mt-3 text-xl font-semibold text-gray-900">{selectedStep.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-800">{selectedStep.content}</p>
          </div>
          {selectedStep.estimatedTime && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-3 py-1 text-xs font-medium text-gray-700">
              <Clock className="h-3.5 w-3.5" />
              {selectedStep.estimatedTime}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.action}
              type="button"
              onClick={() => onActionClick?.(action.action)}
              className={action.primary
                ? 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors'
                : 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'}
            >
              {action.label}
              <ArrowRight className="h-4 w-4" />
            </button>
          ))}
        </div>

        {selectedStep.subItems && selectedStep.subItems.length > 0 && (
          <div className="mt-5 border-t border-white/80 pt-4">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? 'Hide supporting detail' : `Show supporting detail (${selectedStep.subItems.length})`}
            </button>

            {showDetails && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {selectedStep.subItems.map((item, idx) => (
                  <div key={`${selectedStep.step}-${idx}`} className="rounded-xl border border-white/80 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    <p className="mt-1 text-sm text-gray-700">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-gray-700">
        <p>
          <span className="font-medium">Important:</span> This is legal information only, not legal advice.
          Consider speaking with a lawyer if the facts are disputed, the deadline is tight, or the stakes are high.
        </p>
      </div>
    </div>
  );
};

export default GuidanceNarrative;