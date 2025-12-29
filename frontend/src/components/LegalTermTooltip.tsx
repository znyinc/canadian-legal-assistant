import React, { useState } from 'react';

interface LegalTerm {
  term: string;
  plainLanguage: string;
  explanation: string;
  learnMoreUrl?: string;
  category: string;
}

interface LegalTermTooltipProps {
  term: string;
  definition: LegalTerm;
  children?: React.ReactNode;
}

/**
 * Inline tooltip for legal terms with plain language explanations.
 * Shows on hover with expandable "Learn More" link.
 */
export function LegalTermTooltip({ term, definition, children }: LegalTermTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-blue-600 cursor-help text-blue-600"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-label={`Definition of ${term}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
            e.preventDefault();
          }
        }}
      >
        {children || term}
      </span>
      
      {isOpen && (
        <div
          className="absolute z-50 w-80 p-4 mt-2 bg-white border border-gray-300 rounded-lg shadow-xl"
          role="tooltip"
        >
          <div className="mb-2">
            <h4 className="font-bold text-gray-900">{definition.term}</h4>
            <p className="text-sm text-blue-600 italic">{definition.plainLanguage}</p>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">{definition.explanation}</p>
          
          {definition.learnMoreUrl && (
            <a
              href={definition.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center"
            >
              Learn More
              <svg
                className="w-3 h-3 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
          
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            {definition.category}
          </span>
        </div>
      )}
    </span>
  );
}

/**
 * Automatically wraps legal terms in tooltips throughout text.
 */
export function AutoTooltipText({ 
  text, 
  terms 
}: { 
  text: string; 
  terms: Map<string, LegalTerm>;
}) {
  // Find all legal terms in the text
  const words = text.split(/(\s+)/);
  
  return (
    <>
      {words.map((word, index) => {
        const cleanWord = word.replace(/[.,!?;:]$/, '').toLowerCase();
        const term = terms.get(cleanWord);
        
        if (term) {
          const punctuation = word.match(/[.,!?;:]$/)?.[0] || '';
          return (
            <React.Fragment key={index}>
              <LegalTermTooltip term={term.term} definition={term}>
                {word.replace(/[.,!?;:]$/, '')}
              </LegalTermTooltip>
              {punctuation}
            </React.Fragment>
          );
        }
        
        return <React.Fragment key={index}>{word}</React.Fragment>;
      })}
    </>
  );
}
