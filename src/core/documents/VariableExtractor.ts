/**
 * VariableExtractor: Extract key variables from user descriptions and matter data
 * Prefers structured wizard answers over text parsing for accuracy
 */

export interface ExtractedVariables {
  // Parties
  claimantName?: string;
  respondentName?: string;
  lawyerName?: string;
  
  // Dates
  incidentDate?: string;
  deadlineDate?: string;
  limitationExpiredDate?: string;
  discoveryDate?: string;
  
  // Amounts
  amountClaimed?: string | number;
  amountDisputed?: string | number;
  damageAmount?: string | number;
  
  // Locations
  propertyAddress?: string;
  courtLocation?: string;
  jurisdiction?: string;
  
  // Details
  claimDescription?: string;
  incidentSummary?: string;
  particulars?: string;
  underlyingClaimType?: string;
  
  // Other
  matterType?: string;
  tags?: string[];
  [key: string]: string | number | undefined | string[];
}

export class VariableExtractor {
  /**
   * Extract variables from structured wizard answers first, fall back to text parsing
   */
  extractFromMatter(
    description: string,
    classification?: any,
    metadata?: { structuredAnswers?: any[]; variables?: Record<string, any> }
  ): ExtractedVariables {
    const result: ExtractedVariables = {};

    // Prefer pre-extracted variables from wizard
    if (metadata?.variables) {
      Object.assign(result, metadata.variables);
      return result; // Structured data is always preferred
    }

    // Fall back to text parsing for legacy matters
    return this.extractFromDescription(description, classification);
  }

  /**
   * Extract variables from matter description and classification
   * Uses heuristic pattern matching to find names, dates, amounts, etc.
   */
  extractFromDescription(description: string, classification?: any): ExtractedVariables {
    const result: ExtractedVariables = {};

    if (!description) return result;

    const text = description;

    // Extract person names (assume first proper nouns after certain keywords are names)
    const lawyerMatch = text.match(/(?:lawyer|attorney|counsel|solicitor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (lawyerMatch) result.lawyerName = lawyerMatch[1];

    const suesMatch = text.match(/(?:suing|sues|sued|against|defendant?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (suesMatch) result.respondentName = suesMatch[1];

    // Look for explicit "I" or "My" statements that indicate claimant
    const myMatch = text.match(/(?:I|my|we|our)\s+(?:was|were|am|is|have|has)\s+(?:.*?)\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (myMatch && !result.respondentName) result.respondentName = myMatch[1];

    // Extract dates with context-aware keyword matching
    // Look for specific keywords first to get accurate mapping
    const discoveryMatch = text.match(/discovery.*?(\d{4}-\d{2}-\d{2}|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)/i);
    if (discoveryMatch) result.discoveryDate = discoveryMatch[1];
    
    const deadlineMatch = text.match(/(?:deadline|limitation|missed).*?(\d{4}-\d{2}-\d{2}|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)/i);
    if (deadlineMatch) result.deadlineDate = deadlineMatch[1];
    
    const incidentMatch = text.match(/(?:incident|occurred|happened|date of|when).*?(\d{4}-\d{2}-\d{2}|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b)/i);
    if (incidentMatch) result.incidentDate = incidentMatch[1];
    
    // Fallback: if we still don't have dates, use general regex to find ALL dates
    if (!result.discoveryDate || !result.deadlineDate || !result.incidentDate) {
      const dateMatches = text.match(/\d{4}-\d{2}-\d{2}|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi);
      if (dateMatches && dateMatches.length > 0) {
        if (!result.incidentDate) result.incidentDate = dateMatches[0];
        if (!result.deadlineDate && dateMatches.length > 1) result.deadlineDate = dateMatches[1];
        if (!result.discoveryDate && dateMatches.length > 2) result.discoveryDate = dateMatches[2];
      }
    }

    // Extract monetary amounts ($50,000, 50000, etc.) and format with commas and $
    // STRICT: Require either $ prefix OR "dollars"/"CAD" suffix to avoid matching dates (e.g., "2025" or "202")
    const amountMatches = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|CAD)/gi);
    if (amountMatches && amountMatches.length > 0) {
      // Format: remove $ and spaces, keep commas for readability, re-add $
      const cleanAmount = amountMatches[0]
        .replace(/\$/g, '')
        .trim()
        .replace(/dollars?/gi, '')
        .replace(/CAD/i, '')
        .trim()
        .replace(/,/g, ''); // Remove existing commas first
      
      const amountNum = Number(cleanAmount);
      if (!isNaN(amountNum) && amountNum > 0) {
        // Re-add commas for thousands
        const formatted = amountNum.toLocaleString('en-US');
        result.amountClaimed = `$${formatted}`;
        
        if (amountMatches.length > 1) {
          const cleanAmount2 = amountMatches[1]
            .replace(/\$/g, '')
            .trim()
            .replace(/dollars?/gi, '')
            .replace(/CAD/i, '')
            .trim()
            .replace(/,/g, '');
          const amountNum2 = Number(cleanAmount2);
          if (!isNaN(amountNum2) && amountNum2 > 0) {
            result.damageAmount = `$${amountNum2.toLocaleString('en-US')}`;
          }
        }
      }
    }

    // Extract addresses (look for street patterns)
    const addressMatch = text.match(/(\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Court|Ct|Place|Pl|Way|Circle|Crescent|Cres)[.,]?\s*(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?,?\s*(?:ON|Ontario))/i);
    if (addressMatch) result.propertyAddress = addressMatch[1];

    // Extract case type keywords
    if (text.match(/slip\s+and?\s+fall|premises liability/i)) result.matterType = 'Slip and Fall';
    if (text.match(/negligence|tort|negligent/i)) result.matterType = 'Negligence';
    if (text.match(/malpractice|missed.*deadline|missed.*limitation/i)) result.matterType = 'Professional Malpractice';
    if (text.match(/contract|breach|agreement/i)) result.matterType = 'Contract';
    if (text.match(/landlord|tenant|eviction|rent/i)) result.matterType = 'Landlord/Tenant';
    if (text.match(/employment|dismissal|harassment|wrongful|termination/i)) result.matterType = 'Employment';
    if (text.match(/product liability|defective/i)) result.matterType = 'Product Liability';

    // Merge with classification data
    if (classification) {
      if (classification.parties?.names?.[0]) result.claimantName = classification.parties.names[0];
      if (classification.jurisdiction) result.jurisdiction = classification.jurisdiction;
      
      // If amount wasn't extracted from description, use disputeAmount from classification
      if (!result.amountClaimed && classification.disputeAmount) {
        result.amountClaimed = `$${Number(classification.disputeAmount).toLocaleString('en-US')}`;
      }
      
      if (classification.notes) result.particulars = classification.notes.join('\n');
    }

    return result;
  }

  /**
   * Fill template placeholders with extracted variables
   * Falls back to placeholder text if variable not found
   */
  fillPlaceholders(template: string, variables: ExtractedVariables, options?: { keepPlaceholders?: boolean }): string {
    return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, key) => {
      const value = variables[key];
      if (value === undefined || value === null) {
        // Return placeholder if keepPlaceholders is true, otherwise empty string
        return options?.keepPlaceholders ? match : '';
      }
      return String(value);
    });
  }

  /**
   * Validate extracted variables and flag missing critical ones
   */
  validateVariables(variables: ExtractedVariables, requiredFields: string[]): { valid: boolean; missing: string[] } {
    const missing = requiredFields.filter((field) => !variables[field]);
    return {
      valid: missing.length === 0,
      missing
    };
  }
}
