import React from 'react';

interface ReadabilityScore {
  score: number;
  grade: 'very-easy' | 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  gradeLevel: number;
  suggestions: string[];
  metrics: {
    avgSentenceLength: number;
    avgWordLength: number;
    syllablesPerWord: number;
    legalTermCount: number;
    complexWordCount: number;
  };
}

interface ReadabilityIndicatorProps {
  score: ReadabilityScore;
  showDetails?: boolean;
}

/**
 * Visual indicator for document readability with optional detailed breakdown.
 */
export function ReadabilityIndicator({ score, showDetails = false }: ReadabilityIndicatorProps) {
  const gradeColors: Record<ReadabilityScore['grade'], string> = {
    'very-easy': 'bg-green-500',
    'easy': 'bg-green-400',
    'moderate': 'bg-yellow-400',
    'difficult': 'bg-orange-500',
    'very-difficult': 'bg-red-500',
  };

  const gradeLabels: Record<ReadabilityScore['grade'], string> = {
    'very-easy': 'Very Easy',
    'easy': 'Easy',
    'moderate': 'Moderate',
    'difficult': 'Difficult',
    'very-difficult': 'Very Difficult',
  };

  const gradeDescriptions: Record<ReadabilityScore['grade'], string> = {
    'very-easy': 'Understood by 11-year-olds',
    'easy': 'Conversational English',
    'moderate': 'Plain English for general audiences',
    'difficult': 'Requires post-secondary education',
    'very-difficult': 'Best for university graduates',
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Readability</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gray-900">{score.score}</span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${gradeColors[score.grade]}`}>
            {gradeLabels[score.grade]}
          </span>
          <span className="text-xs text-gray-500">Grade {score.gradeLevel}+</span>
        </div>
        <p className="text-xs text-gray-600">{gradeDescriptions[score.grade]}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all ${gradeColors[score.grade]}`}
          style={{ width: `${score.score}%` }}
        />
      </div>

      {/* Suggestions */}
      {score.suggestions.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-1">Suggestions:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {score.suggestions.map((suggestion, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed metrics */}
      {showDetails && (
        <details className="text-xs">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
            Show Metrics
          </summary>
          <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. sentence length:</span>
              <span className="font-medium">{score.metrics.avgSentenceLength} words</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. word length:</span>
              <span className="font-medium">{score.metrics.avgWordLength} characters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Syllables per word:</span>
              <span className="font-medium">{score.metrics.syllablesPerWord}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Legal terms:</span>
              <span className="font-medium">{score.metrics.legalTermCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Complex words:</span>
              <span className="font-medium">{score.metrics.complexWordCount}</span>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
