import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ConversationalIntake from '../components/ConversationalIntake';
import GuidanceNarrative from '../components/GuidanceNarrative';

type PageStage = 'intake' | 'loading' | 'guidance' | 'error';

interface GuidanceStep {
  step: 'acknowledge' | 'orient' | 'prioritize' | 'guide' | 'prepare' | 'offer';
  title: string;
  content: string;
  expandable?: boolean;
  subItems?: Array<{
    label: string;
    detail: string;
  }>;
  estimatedTime?: string;
  urgencyLevel?: 'critical' | 'warning' | 'info';
}

export const ConversationalGuidancePage: React.FC<{
  onBack: () => void;
}> = ({ onBack }) => {
  const [stage, setStage] = useState<PageStage>('intake');
  const [classification, setClassification] = useState<any>(null);
  const [guidanceSteps, setGuidanceSteps] = useState<GuidanceStep[]>([]);
  const [error, setError] = useState<string>('');

  const handleIntakeComplete = async (matterData: {
    description: string;
    domain?: string;
    jurisdiction?: string;
    urgency?: string;
    evidenceFiles?: File[];
  }) => {
    setStage('loading');
    try {
      // Call backend to get guidance using GuidanceAgent
      const response = await fetch('/api/conversational/guidance/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: matterData.description,
          domain: matterData.domain,
          jurisdiction: matterData.jurisdiction,
          urgency: matterData.urgency,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate guidance');

      const data = await response.json();

      setClassification({
        domain: data.classification?.domain || matterData.domain,
        jurisdiction: data.classification?.jurisdiction || matterData.jurisdiction,
        pillar: data.classification?.pillar || 'Legal matter',
      });

      // Transform GuidanceAgent response to GuidanceStep format
      const steps: GuidanceStep[] = [
        {
          step: 'acknowledge',
          title: data.guidance?.acknowledgment?.title || 'Your situation',
          content: data.guidance?.acknowledgment?.text || '',
        },
        {
          step: 'orient',
          title: data.guidance?.orientation?.title || 'What this means',
          content: data.guidance?.orientation?.text || '',
        },
        {
          step: 'prioritize',
          title: data.guidance?.prioritization?.title || 'What needs to happen first',
          content: data.guidance?.prioritization?.text || '',
          urgencyLevel: 'critical',
          estimatedTime: '24-48 hours',
          subItems: data.guidance?.prioritization?.actions?.map((action: any) => ({
            label: action.title,
            detail: action.description,
          })) || [],
        },
        {
          step: 'guide',
          title: data.guidance?.guidance?.title || 'Your path forward',
          content: data.guidance?.guidance?.text || '',
          subItems: data.guidance?.guidance?.steps?.map((step: any) => ({
            label: step.title,
            detail: step.description,
          })) || [],
        },
        {
          step: 'prepare',
          title: data.guidance?.preparation?.title || 'What to expect',
          content: data.guidance?.preparation?.text || '',
          estimatedTime: data.guidance?.preparation?.timeline || 'Variable',
          subItems: data.guidance?.preparation?.outcomes?.map((outcome: any) => ({
            label: outcome.title,
            detail: outcome.description,
          })) || [],
        },
        {
          step: 'offer',
          title: 'How we can help',
          content: data.guidance?.offer?.text || 'I can help you draft documents, build timelines, and explore your options.',
          subItems: data.guidance?.offer?.services?.map((service: any) => ({
            label: service.title,
            detail: service.description,
          })) || [],
        },
      ];

      setGuidanceSteps(steps);
      setStage('guidance');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStage('error');
    }
  };

  const handleActionClick = (action: string) => {
    // Route to specific workflows
    console.log('Action clicked:', action);
    // Would route to document generation, timeline builder, etc.
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900">
            {stage === 'intake' && 'Tell me what\'s happening'}
            {stage === 'loading' && 'Analyzing your situation'}
            {stage === 'guidance' && 'Here\'s what you need to know'}
            {stage === 'error' && 'Something went wrong'}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stage === 'intake' && (
          <ConversationalIntake onComplete={handleIntakeComplete} onCancel={onBack} />
        )}

        {stage === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Analyzing your situation and preparing guidance...</p>
          </div>
        )}

        {stage === 'guidance' && classification && (
          <GuidanceNarrative
            steps={guidanceSteps}
            classification={classification}
            onActionClick={handleActionClick}
          />
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
