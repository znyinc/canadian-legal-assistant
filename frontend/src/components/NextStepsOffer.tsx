import React, { useState } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';

interface NextStepOffer {
  label: string;
  description: string;
  action: 'generate' | 'download' | 'view' | 'info';
  documentType?: string;
}

interface NextStepsOfferProps {
  offers: NextStepOffer[];
  onGenerateDocument?: (documentType: string) => Promise<void>;
  onDownloadDocument?: (documentType: string) => void;
  isLoading?: boolean;
}

/**
 * Presents next step opportunities in a conversational, non-pushy way.
 * Enables document generation and provides information suggestions.
 */
export const NextStepsOffer: React.FC<NextStepsOfferProps> = ({
  offers,
  onGenerateDocument,
  onDownloadDocument,
  isLoading = false,
}) => {
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

  const handleGenerateClick = async (offer: NextStepOffer) => {
    if (!offer.documentType || !onGenerateDocument) return;

    setGeneratingDoc(offer.documentType);
    try {
      await onGenerateDocument(offer.documentType);
    } catch (error) {
      console.error('Failed to generate document:', error);
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleDownloadClick = (offer: NextStepOffer) => {
    if (!offer.documentType || !onDownloadDocument) return;
    onDownloadDocument(offer.documentType);
  };

  if (offers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-600" />
        Ready for Next Steps?
      </h2>

      <p className="text-sm text-gray-700 mb-4">
        Based on your situation, here are documents and information that might help:
      </p>

      <div className="space-y-3">
        {offers.map((offer, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{offer.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
              </div>

              {offer.action === 'generate' && (
                <button
                  onClick={() => handleGenerateClick(offer)}
                  disabled={isLoading || generatingDoc === offer.documentType}
                  className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  {generatingDoc === offer.documentType ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      Generate
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {offer.action === 'download' && (
                <button
                  onClick={() => handleDownloadClick(offer)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  Download
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {offer.action === 'view' && (
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {offer.action === 'info' && (
                <div className="text-xs font-semibold px-3 py-2 bg-gray-100 text-gray-700 rounded flex-shrink-0">
                  Info
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white border border-gray-200 rounded text-sm text-gray-700">
        <strong>No pressure:</strong> Generate or review these whenever you're ready. You control
        the pace.
      </div>
    </div>
  );
};
