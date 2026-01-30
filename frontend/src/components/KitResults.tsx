import React, { useState } from 'react';
import { Download, Share2, Copy, CheckCircle, FileText, AlertCircle, ArrowRight } from 'lucide-react';

export interface KitResult {
  kitId: string;
  kitName: string;
  completedAt: Date;
  documents: {
    name: string;
    type: string;
    content: string;
    downloadUrl?: string;
  }[];
  actionItems: {
    title: string;
    deadline?: Date;
    status: 'pending' | 'completed';
    resources?: { title: string; url: string }[];
  }[];
  recommendations: string[];
  nextSteps: {
    step: number;
    title: string;
    description: string;
    resources?: { title: string; url: string }[];
  }[];
  caseStrength?: 'strong' | 'moderate' | 'weak';
  estimatedCost?: { min: number; max: number };
  settlementProbability?: 'high' | 'moderate' | 'low';
}

export interface KitResultsProps {
  result: KitResult;
  onGenerateDocument?: (documentType: string) => void;
  onExportResults?: () => void;
  onContinueToNewKit?: () => void;
  showDocumentGeneration?: boolean;
}

const getStatusIcon = (status: string) => {
  if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-600" />;
  if (status === 'pending') return <AlertCircle className="w-5 h-5 text-orange-600" />;
  return <AlertCircle className="w-5 h-5 text-gray-400" />;
};

const getCaseStrengthColor = (strength: 'strong' | 'moderate' | 'weak') => {
  switch (strength) {
    case 'strong':
      return 'bg-green-50 border-green-300 text-green-900';
    case 'moderate':
      return 'bg-yellow-50 border-yellow-300 text-yellow-900';
    case 'weak':
      return 'bg-red-50 border-red-300 text-red-900';
  }
};

const getProbabilityColor = (probability: 'high' | 'moderate' | 'low') => {
  switch (probability) {
    case 'high':
      return 'text-green-600';
    case 'moderate':
      return 'text-yellow-600';
    case 'low':
      return 'text-red-600';
  }
};

/**
 * KitResults Component
 * Comprehensive kit completion summary with actionable next steps
 * Features: Document generation, recommendations, timeline, resource links, export/share
 */
export const KitResults: React.FC<KitResultsProps> = ({
  result,
  onGenerateDocument,
  onExportResults,
  onContinueToNewKit,
  showDocumentGeneration = true,
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyLink = (index: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const completedActions = result.actionItems.filter((a) => a.status === 'completed').length;
  const totalActions = result.actionItems.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Success Header */}
      <div className="px-6 py-8 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Kit Complete!</h1>
        </div>
        <p className="text-gray-700 mb-4">
          You've completed the <span className="font-semibold">{result.kitName}</span> kit. Here's a summary of your
          results and recommended next steps.
        </p>
        <div className="text-sm text-gray-600">
          Completed at: {result.completedAt.toLocaleString()}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {/* Case Assessment */}
        {(result.caseStrength || result.estimatedCost || result.settlementProbability) && (
          <div className="px-6 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Case Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.caseStrength && (
                <div className={`p-4 rounded-lg border-2 ${getCaseStrengthColor(result.caseStrength)}`}>
                  <div className="text-sm font-medium opacity-75 mb-1">Case Strength</div>
                  <div className="text-2xl font-bold">{result.caseStrength.charAt(0).toUpperCase() + result.caseStrength.slice(1)}</div>
                </div>
              )}

              {result.settlementProbability && (
                <div className="p-4 rounded-lg border-2 border-blue-300 bg-blue-50 text-blue-900">
                  <div className="text-sm font-medium opacity-75 mb-1">Settlement Probability</div>
                  <div className={`text-2xl font-bold ${getProbabilityColor(result.settlementProbability)}`}>
                    {result.settlementProbability.charAt(0).toUpperCase() + result.settlementProbability.slice(1)}
                  </div>
                </div>
              )}

              {result.estimatedCost && (
                <div className="p-4 rounded-lg border-2 border-purple-300 bg-purple-50 text-purple-900">
                  <div className="text-sm font-medium opacity-75 mb-1">Estimated Cost Range</div>
                  <div className="text-2xl font-bold">
                    ${result.estimatedCost.min.toLocaleString()} - ${result.estimatedCost.max.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Documents */}
        {showDocumentGeneration && result.documents.length > 0 && (
          <div className="px-6 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Generated Documents
            </h2>
            <div className="space-y-3">
              {result.documents.map((doc, idx) => (
                <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-600">{doc.type}</p>
                    </div>
                    <div className="flex gap-2">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          download
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleCopyLink(idx, doc.content)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{doc.content.substring(0, 150)}...</p>
                </div>
              ))}
            </div>

            {onGenerateDocument && (
              <button
                onClick={() => onGenerateDocument('all')}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Generate All Documents
              </button>
            )}
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="px-6 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h2>
            <div className="space-y-3">
              {result.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-gray-900">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Action Items</h2>
          <div className="mb-4 text-sm text-gray-600">
            {completedActions} of {totalActions} items completed
          </div>
          <div className="space-y-3">
            {result.actionItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start gap-3">
                  {getStatusIcon(item.status)}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>
                    {item.deadline && (
                      <p className="text-sm text-gray-600 mt-1">
                        Deadline: {new Date(item.deadline).toLocaleDateString()}
                      </p>
                    )}
                    {item.resources && item.resources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.resources.map((res, ridx) => (
                          <a
                            key={ridx}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {res.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRight className="w-6 h-6 text-blue-600" />
            What's Next?
          </h2>
          <div className="space-y-4">
            {result.nextSteps.map((step, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                  className="w-full text-left p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {step.step}
                      </div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    </div>
                    <span className="text-blue-600">
                      {expandedStep === idx ? '−' : '+'}
                    </span>
                  </div>
                </button>

                {expandedStep === idx && (
                  <div className="mt-2 p-4 bg-white border border-blue-200 border-t-0 rounded-b-lg">
                    <p className="text-gray-700 mb-3">{step.description}</p>
                    {step.resources && step.resources.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">Resources:</p>
                        <div className="space-y-1">
                          {step.resources.map((res, ridx) => (
                            <a
                              key={ridx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline block"
                            >
                              → {res.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 flex gap-3 flex-wrap">
        {onExportResults && (
          <button
            onClick={onExportResults}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Results
          </button>
        )}

        <button
          onClick={() => {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            alert('Results link copied to clipboard');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          <Share2 className="w-5 h-5" />
          Share Results
        </button>

        {onContinueToNewKit && (
          <button
            onClick={onContinueToNewKit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Continue to New Kit
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
        <p className="text-sm text-amber-900">
          <strong>Important:</strong> These results are for informational purposes only and do not constitute legal advice.
          Always consult with a qualified lawyer or paralegal before taking action.
        </p>
      </div>
    </div>
  );
};
