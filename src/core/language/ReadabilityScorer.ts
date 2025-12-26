/**
 * Readability assessment for legal documents and text.
 * Uses Flesch Reading Ease score and custom complexity metrics.
 */

export interface ReadabilityScore {
  score: number; // 0-100 (higher = easier to read)
  grade: 'very-easy' | 'easy' | 'moderate' | 'difficult' | 'very-difficult';
  gradeLevel: number; // Estimated grade level required to understand
  suggestions: string[];
  metrics: {
    avgSentenceLength: number;
    avgWordLength: number;
    syllablesPerWord: number;
    legalTermCount: number;
    complexWordCount: number;
  };
}

export class ReadabilityScorer {
  private commonLegalTerms = new Set([
    'plaintiff', 'defendant', 'claimant', 'respondent', 'damages', 'negligence',
    'liability', 'breach', 'contract', 'affidavit', 'discovery', 'tribunal',
    'statute', 'regulation', 'jurisdiction', 'appeal', 'injunction', 'remedy',
  ]);

  /**
   * Calculate readability score for text.
   */
  score(text: string): ReadabilityScore {
    const sentences = this.splitIntoSentences(text);
    const words = this.splitIntoWords(text);
    const syllables = this.countSyllables(words);
    
    const avgSentenceLength = words.length / Math.max(sentences.length, 1);
    const avgWordLength = words.join('').length / Math.max(words.length, 1);
    const syllablesPerWord = syllables / Math.max(words.length, 1);
    
    const legalTermCount = this.countLegalTerms(words);
    const complexWordCount = this.countComplexWords(words);
    
    // Flesch Reading Ease formula
    const fleschScore = 206.835 
      - (1.015 * avgSentenceLength) 
      - (84.6 * syllablesPerWord);
    
    // Adjust for legal complexity
    const legalComplexityPenalty = (legalTermCount / Math.max(words.length, 1)) * 50;
    const adjustedScore = Math.max(0, Math.min(100, fleschScore - legalComplexityPenalty));
    
    const grade = this.getGrade(adjustedScore);
    const gradeLevel = this.getGradeLevel(adjustedScore);
    const suggestions = this.generateSuggestions({
      avgSentenceLength,
      avgWordLength,
      syllablesPerWord,
      legalTermCount,
      complexWordCount,
      wordCount: words.length,
    });
    
    return {
      score: Math.round(adjustedScore),
      grade,
      gradeLevel,
      suggestions,
      metrics: {
        avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
        avgWordLength: Math.round(avgWordLength * 10) / 10,
        syllablesPerWord: Math.round(syllablesPerWord * 10) / 10,
        legalTermCount,
        complexWordCount,
      },
    };
  }

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private splitIntoWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private countSyllables(words: string[]): number {
    return words.reduce((total, word) => total + this.syllableCount(word), 0);
  }

  private syllableCount(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove silent 'e' at the end
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    return Math.max(1, vowelGroups?.length ?? 1);
  }

  private countLegalTerms(words: string[]): number {
    return words.filter(w => this.commonLegalTerms.has(w)).length;
  }

  private countComplexWords(words: string[]): number {
    // Words with 3+ syllables are considered complex
    return words.filter(w => this.syllableCount(w) >= 3).length;
  }

  private getGrade(score: number): ReadabilityScore['grade'] {
    if (score >= 80) return 'very-easy';
    if (score >= 60) return 'easy';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'difficult';
    return 'very-difficult';
  }

  private getGradeLevel(score: number): number {
    // Approximate grade level using Flesch-Kincaid formula
    if (score >= 90) return 5;
    if (score >= 80) return 6;
    if (score >= 70) return 7;
    if (score >= 60) return 8;
    if (score >= 50) return 10;
    if (score >= 40) return 12;
    if (score >= 30) return 13;
    return 16; // College+
  }

  private generateSuggestions(metrics: {
    avgSentenceLength: number;
    avgWordLength: number;
    syllablesPerWord: number;
    legalTermCount: number;
    complexWordCount: number;
    wordCount: number;
  }): string[] {
    const suggestions: string[] = [];
    
    if (metrics.avgSentenceLength > 20) {
      suggestions.push('Break long sentences into shorter ones (aim for 15-20 words per sentence)');
    }
    
    if (metrics.syllablesPerWord > 1.7) {
      suggestions.push('Use simpler words where possible (fewer syllables)');
    }
    
    const legalTermRatio = metrics.legalTermCount / metrics.wordCount;
    if (legalTermRatio > 0.05) {
      suggestions.push('Consider explaining legal terms in plain language or adding tooltips');
    }
    
    const complexWordRatio = metrics.complexWordCount / metrics.wordCount;
    if (complexWordRatio > 0.15) {
      suggestions.push('Replace complex words with simpler alternatives where appropriate');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Text is reasonably clear and accessible');
    }
    
    return suggestions;
  }

  /**
   * Get a description of what a readability grade means.
   */
  gradeDescription(grade: ReadabilityScore['grade']): string {
    const descriptions: Record<ReadabilityScore['grade'], string> = {
      'very-easy': 'Very easy to read. Understood by 11-year-olds.',
      'easy': 'Easy to read. Conversational English for consumers.',
      'moderate': 'Fairly easy to read. Plain English for general audiences.',
      'difficult': 'Difficult to read. Requires post-secondary education.',
      'very-difficult': 'Very difficult to read. Best understood by university graduates.',
    };
    return descriptions[grade];
  }
}
