import { Question, QuestionnaireLibrary } from './QuestionnaireLibrary';
import { Domain } from '../models';

/**
 * Structured answer from wizard
 */
export interface StructuredAnswer {
  questionId: string;
  value: string | string[] | number | boolean;
  label?: string; // Human-readable label for select options
}

/**
 * Wizard state for intake process
 */
export interface WizardState {
  currentStep: number;
  totalSteps: number;
  domain?: Domain;
  answers: StructuredAnswer[];
  isComplete: boolean;
}

/**
 * Engine to manage questionnaire workflow and extract structured data
 */
export class QuestionnaireEngine {
  private library: QuestionnaireLibrary;

  constructor() {
    this.library = new QuestionnaireLibrary();
  }

  /**
   * Get questions for a domain
   */
  getQuestions(domain: Domain): Question[] {
    return this.library.getQuestions(domain);
  }

  /**
   * Filter questions based on previous answers (handle dependencies)
   */
  filterQuestions(questions: Question[], answers: StructuredAnswer[]): Question[] {
    return questions.filter((q) => {
      if (!q.dependsOn) return true;

      const dependentAnswer = answers.find((a) => a.questionId === q.dependsOn!.questionId);
      if (!dependentAnswer) return false;

      const expectedValue = q.dependsOn.value;
      const actualValue = dependentAnswer.value;

      if (Array.isArray(expectedValue)) {
        return expectedValue.includes(actualValue as string);
      }

      return actualValue === expectedValue;
    });
  }

  /**
   * Validate an answer against question constraints
   */
  validateAnswer(question: Question, value: any): { valid: boolean; error?: string } {
    if (question.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: 'This field is required' };
    }

    if (!value && !question.required) {
      return { valid: true };
    }

    if (question.validation) {
      const { min, max, pattern, message } = question.validation;

      if (min !== undefined && typeof value === 'number' && value < min) {
        return { valid: false, error: message || `Minimum value is ${min}` };
      }

      if (max !== undefined && typeof value === 'number' && value > max) {
        return { valid: false, error: message || `Maximum value is ${max}` };
      }

      if (pattern && typeof value === 'string' && !pattern.test(value)) {
        return { valid: false, error: message || 'Invalid format' };
      }
    }

    return { valid: true };
  }

  /**
   * Extract structured data for document generation
   */
  extractVariables(answers: StructuredAnswer[]): Record<string, any> {
    const variables: Record<string, any> = {};

    for (const answer of answers) {
      // Map common question IDs to variable names
      const variableMap: Record<string, string> = {
        lawyer_name: 'lawyerName',
        law_firm: 'lawFirm',
        discovery_date: 'discoveryDate',
        original_claim_type: 'originalClaimType',
        original_claim_value: 'amountClaimed',
        incident_date: 'incidentDate',
        at_fault_party: 'defendantName',
        estimated_damages: 'amountClaimed',
        employer_name: 'employerName',
        annual_salary: 'salary',
        property_address: 'propertyAddress',
        monthly_rent: 'monthlyRent',
        business_name: 'businessName',
        purchase_amount: 'purchaseAmount',
      };

      const variableName = variableMap[answer.questionId] || answer.questionId;
      variables[variableName] = answer.value;

      // Also store the label if available (for select options)
      if (answer.label) {
        variables[`${variableName}_label`] = answer.label;
      }
    }

    return variables;
  }

  /**
   * Generate a natural description from structured answers
   */
  generateDescription(domain: Domain, answers: StructuredAnswer[]): string {
    const vars = this.extractVariables(answers);

    // Domain-specific description templates
    if (domain === 'legalMalpractice') {
      const parts = [];
      if (vars.lawyerName) parts.push(`My lawyer ${vars.lawyerName}`);
      if (vars.what_went_wrong_label) parts.push(vars.what_went_wrong_label.toLowerCase());
      if (vars.originalClaimType_label) parts.push(`on my ${vars.originalClaimType_label.toLowerCase()} case`);
      if (vars.discoveryDate) parts.push(`I discovered this on ${vars.discoveryDate}`);
      if (vars.amountClaimed) parts.push(`The original claim was worth $${vars.amountClaimed}`);

      return parts.join('. ') + '.';
    }

    if (domain === 'criminal') {
      const parts = [];
      if (vars.your_role_label) parts.push(`I am the ${vars.your_role_label.toLowerCase()}`);
      if (vars.charge_type_label) parts.push(`in a ${vars.charge_type_label.toLowerCase()} case`);
      if (vars.incidentDate) parts.push(`The incident occurred on ${vars.incidentDate}`);
      if (vars.occurrence_number) parts.push(`Police occurrence number: ${vars.occurrence_number}`);

      return parts.join('. ') + '.';
    }

    if (domain === 'civil-negligence') {
      const parts = [];
      if (vars.what_happened_label) parts.push(`${vars.what_happened_label}`);
      if (vars.incidentDate) parts.push(`occurred on ${vars.incidentDate}`);
      if (vars.defendantName) parts.push(`Responsible party: ${vars.defendantName}`);
      if (vars.amountClaimed) parts.push(`Estimated damages: $${vars.amountClaimed}`);

      return parts.join('. ') + '.';
    }

    if (domain === 'employment') {
      const parts = [];
      if (vars.issue_type_label) parts.push(vars.issue_type_label);
      if (vars.employerName) parts.push(`at ${vars.employerName}`);
      if (vars.termination_date) parts.push(`Terminated on ${vars.termination_date}`);
      if (vars.years_employed) parts.push(`Worked there for ${vars.years_employed}`);

      return parts.join('. ') + '.';
    }

    if (domain === 'landlordTenant') {
      const parts = [];
      if (vars.your_role_label) parts.push(`I am the ${vars.your_role_label.toLowerCase()}`);
      if (vars.issue_type_label) parts.push(`Issue: ${vars.issue_type_label.toLowerCase()}`);
      if (vars.propertyAddress) parts.push(`Property: ${vars.propertyAddress}`);
      if (vars.monthlyRent) parts.push(`Rent: $${vars.monthlyRent}/month`);

      return parts.join('. ') + '.';
    }

    if (domain === 'consumerProtection') {
      const parts = [];
      if (vars.issue_type_label) parts.push(vars.issue_type_label);
      if (vars.businessName) parts.push(`with ${vars.businessName}`);
      if (vars.purchaseAmount) parts.push(`Amount: $${vars.purchaseAmount}`);
      if (vars.purchase_date) parts.push(`Purchase date: ${vars.purchase_date}`);

      return parts.join('. ') + '.';
    }

    // Fallback: concatenate all text answers
    return answers
      .filter((a) => typeof a.value === 'string' && a.value.length > 0)
      .map((a) => a.value)
      .join('. ') + '.';
  }
}
