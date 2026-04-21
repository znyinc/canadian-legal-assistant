import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import ConversationalIntake from '../components/ConversationalIntake';

type PageStage = 'intake' | 'loading' | 'error';

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

type MatterDomain =
  | 'criminal'
  | 'insurance'
  | 'landlordTenant'
  | 'employment'
  | 'civilNegligence'
  | 'civil'
  | 'municipalPropertyDamage'
  | 'consumerProtection'
  | 'humanRights'
  | 'ocppFiling'
  | 'family'
  | 'legalMalpractice'
  | 'estateSuccession'
  | 'other';

const ALLOWED_DOMAINS = new Set<MatterDomain>([
  'criminal',
  'insurance',
  'landlordTenant',
  'employment',
  'civilNegligence',
  'civil',
  'municipalPropertyDamage',
  'consumerProtection',
  'humanRights',
  'ocppFiling',
  'family',
  'legalMalpractice',
  'estateSuccession',
  'other',
]);

function normalizeDomain(domain?: string): MatterDomain {
  if (!domain) return 'other';

  const normalized = domain.trim();
  if (ALLOWED_DOMAINS.has(normalized as MatterDomain)) {
    return normalized as MatterDomain;
  }

  const aliasMap: Record<string, MatterDomain> = {
    'civil-negligence': 'civilNegligence',
    'landlord-tenant': 'landlordTenant',
    landlordtenant: 'landlordTenant',
    'municipal-property-damage': 'municipalPropertyDamage',
    municipalpropertydamage: 'municipalPropertyDamage',
    'consumer-protection': 'consumerProtection',
    consumerprotection: 'consumerProtection',
    'human-rights': 'humanRights',
    humanrights: 'humanRights',
    ocppfiling: 'ocppFiling',
    legalmalpractice: 'legalMalpractice',
    'estate-succession': 'estateSuccession',
    estatesuccession: 'estateSuccession',
  };

  const key = normalized.replace(/[^a-zA-Z]/g, '').toLowerCase();
  return aliasMap[key] || 'other';
}

export const ConversationalGuidancePage: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stage, setStage] = useState<PageStage>('intake');
  const [error, setError] = useState<string>('');
  const autoProceedHandledRef = useRef(false);

  const nuanceImport = useMemo(() => {
    const state = location.state as {
      nuanceImport?: {
        description?: string;
        domain?: string;
        jurisdiction?: string;
        urgency?: string;
        incidentSummary?: string;
        likelyTrack?: string;
        evidenceChecklist?: string[];
        transcript?: Array<{
          role?: 'user' | 'assistant';
          content?: string;
        }>;
        source?: string;
        autoProceed?: boolean;
      };
    } | null;

    return state?.nuanceImport || null;
  }, [location.state]);

  const handleIntakeComplete = async (matterData: {
    description: string;
    domain?: string;
    jurisdiction?: string;
    urgency?: string;
    evidenceFiles?: File[];
    strategicBriefing?: StrategicBriefing | null;
    transcript?: Array<{
      type: 'system' | 'user' | 'assistant';
      content: string;
    }>;
    source?: string;
    likelyTrack?: string | null;
    evidenceChecklist?: string[];
  }) => {
    setStage('loading');
    try {
      const conversationalHandoff = {
        source: matterData.source || 'conversational-intake',
        strategicBriefing: matterData.strategicBriefing || null,
        transcript: matterData.transcript || [],
        likelyTrack: matterData.likelyTrack || null,
        evidenceChecklist: matterData.evidenceChecklist || [],
      };

      const createdMatter = await api.createMatter({
        description: matterData.description,
        province: matterData.jurisdiction || 'Ontario',
        domain: normalizeDomain(matterData.domain),
        structuredAnswers: [
          {
            kind: 'conversational-handoff',
            data: conversationalHandoff,
          },
        ],
        variables: {
          intakeMode: 'conversational',
          jurisdiction: matterData.jurisdiction || 'Ontario',
          urgency: matterData.urgency || 'unknown',
          originalDomainHint: matterData.domain || 'other',
          hasConversationalHandoff: true,
        },
      });

      const uploadFailures: string[] = [];
      for (const file of matterData.evidenceFiles || []) {
        try {
          await api.uploadEvidence(createdMatter.id, file);
        } catch (uploadError) {
          uploadFailures.push(
            uploadError instanceof Error ? `${file.name}: ${uploadError.message}` : file.name,
          );
        }
      }

      if (uploadFailures.length > 0) {
        console.warn('Some intake evidence files were not uploaded:', uploadFailures);
      }

      navigate(`/matters/${createdMatter.id}`, {
        state: {
          handoff: {
            ...conversationalHandoff,
            enabled: true,
          } satisfies HandoffContext,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStage('error');
    }
  };

  const importedTranscript = useMemo(
    () =>
      (nuanceImport?.transcript || []).map(
        (entry): { type: 'system' | 'user' | 'assistant'; content: string } => ({
          type: entry.role === 'assistant' ? 'assistant' : 'user',
          content: entry.content || '',
        }),
      ),
    [nuanceImport?.transcript],
  );

  useEffect(() => {
    if (!nuanceImport?.autoProceed || autoProceedHandledRef.current) {
      return;
    }

    autoProceedHandledRef.current = true;

    void handleIntakeComplete({
      description: nuanceImport.incidentSummary || nuanceImport.description || '',
      domain: nuanceImport.domain,
      jurisdiction: nuanceImport.jurisdiction,
      urgency: nuanceImport.urgency,
      source: nuanceImport.source || 'nuance-chat',
      transcript: importedTranscript,
      likelyTrack: nuanceImport.likelyTrack,
      evidenceChecklist: nuanceImport.evidenceChecklist,
    });
  }, [importedTranscript, nuanceImport]);

  const initialDraft = useMemo(() => {
    if (!nuanceImport || nuanceImport.autoProceed) {
      return undefined;
    }

    return {
      description: nuanceImport.incidentSummary || nuanceImport.description,
      domain: nuanceImport.domain,
      jurisdiction: nuanceImport.jurisdiction,
      urgency: nuanceImport.urgency,
      transcript: importedTranscript,
      source: nuanceImport.source || 'nuance-chat',
      likelyTrack: nuanceImport.likelyTrack,
      evidenceChecklist: nuanceImport.evidenceChecklist,
    };
  }, [importedTranscript, nuanceImport]);

  const handleOpenNuance = (draft: {
    description?: string;
    domain?: string;
    jurisdiction?: string;
    urgency?: string;
    strategicBriefing?: StrategicBriefing | null;
    transcript?: Array<{
      type?: 'system' | 'user' | 'assistant';
      content?: string;
    }>;
    source?: string;
    likelyTrack?: string | null;
    evidenceChecklist?: string[];
  }) => {
    navigate('/matters/new', {
      state: {
        seedDraft: {
          description: draft.description,
          domain: draft.domain,
          jurisdiction: draft.jurisdiction,
          urgency: draft.urgency,
          strategicBriefing: draft.strategicBriefing,
          transcript: draft.transcript,
          source: draft.source,
          likelyTrack: draft.likelyTrack,
          evidenceChecklist: draft.evidenceChecklist,
        },
      },
    });
  };

  const handleStartNuanceBranch = () => {
    handleOpenNuance({
      description: initialDraft?.description,
      domain: initialDraft?.domain,
      jurisdiction: initialDraft?.jurisdiction,
      urgency: initialDraft?.urgency,
      transcript: initialDraft?.transcript,
      source: initialDraft?.source || 'conversational-intake',
      likelyTrack: initialDraft?.likelyTrack,
      evidenceChecklist: initialDraft?.evidenceChecklist,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>

          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {stage === 'intake' && 'Tell me what\'s happening'}
            {stage === 'loading' && 'Creating your matter workspace'}
            {stage === 'error' && 'Something went wrong'}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stage === 'intake' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">How this flow works</p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">Review and import the qualified intake.</h2>
              <p className="mt-2 text-sm text-gray-700">
                This page is the structured review step. Use it after the guided chat has tightened the summary, or stay here if you prefer a more direct intake review before the matter workspace is created.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-700">
                <div className="rounded-lg bg-blue-50 px-3 py-2">1. Tighten the story in guided chat</div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">2. Review the structured intake</div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">3. Create the matter workspace</div>
                <div className="rounded-lg bg-blue-50 px-3 py-2">4. Upload evidence after qualification</div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">Need a tighter intake summary?</p>
                <h3 className="mt-2 text-lg font-semibold text-amber-950">Open the deeper cause-and-reason chat.</h3>
                <p className="mt-2 text-sm text-amber-900">
                  Use this when you want the app to tighten the wording, identify the single fact that still changes the route, and hand back a cleaner intake summary before import.
                </p>
                <button
                  onClick={handleStartNuanceBranch}
                  className="mt-4 inline-flex items-center rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                >
                  Return to guided cause-and-reason chat
                </button>
              </div>
            </div>

            {initialDraft?.description && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">Conversation summary imported</p>
                <p className="mt-1 text-sm text-blue-800">
                  Review the imported summary below, edit it if needed, or continue into the guided workspace.
                </p>
              </div>
            )}

            <ConversationalIntake
              onComplete={handleIntakeComplete}
              onCancel={onBack}
              onOpenNuance={handleOpenNuance}
              initialDraft={initialDraft}
            />
          </div>
        )}

        {stage === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Saving your intake, creating the matter, and preparing your workspace...</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error processing your request</h3>
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={() => setStage('intake')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationalGuidancePage;
