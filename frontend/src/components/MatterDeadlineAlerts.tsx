import { useMemo } from 'react';
import { DeadlineAlerts } from './DeadlineAlerts';

interface MatterDeadlineAlertsProps {
  classification: {
    domain?: string;
    subCategory?: string;
    urgency?: string;
    description?: string;
    tags?: string[];
  };
  matterCreatedAt: string;
}

/**
 * Smart wrapper for DeadlineAlerts that generates limitation period alerts
 * based on matter classification.
 */
export function MatterDeadlineAlerts({ classification, matterCreatedAt }: MatterDeadlineAlertsProps) {
  const alerts = useMemo(() => {
    const generated: any[] = [];
    const createdDate = new Date(matterCreatedAt);
    const now = new Date();
    
    // Check for municipal notice requirement
    const description = (classification.description || '').toLowerCase();
    const tags = classification.tags || [];
    const municipalKeywords = ['municipal', 'city', 'town', 'road', 'tree', 'sidewalk', 'pothole', 'streetlight'];
    const hasMunicipalKeyword = municipalKeywords.some(kw => description.includes(kw) || tags.some(t => t.toLowerCase().includes(kw)));
    
    if (hasMunicipalKeyword) {
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = 10 - daysSinceCreated;
      
      generated.push({
        urgency: daysRemaining <= 0 ? 'critical' : daysRemaining <= 3 ? 'warning' : 'caution',
        daysRemaining: Math.max(0, daysRemaining),
        limitationPeriod: {
          name: 'Municipal Notice Requirement',
          period: '10 days',
          description: 'Written notice to municipality required within 10 days of incident for property damage or personal injury claims',
          consequence: 'Failure to provide notice may bar your claim entirely',
          learnMoreUrl: 'https://www.ontario.ca/laws/statute/01m25#BK266',
        },
        message: daysRemaining <= 0 
          ? 'The 10-day municipal notice deadline has passed'
          : `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} to send written notice to the municipality`,
        actionRequired: daysRemaining <= 0
          ? 'Consult a lawyer immediately - you may still have options'
          : 'Send written notice to the municipality describing the incident, date, location, and injuries/damages',
        encouragement: daysRemaining > 0 
          ? "Don't panic - you're taking the right step by addressing this now" 
          : "You're ahead of the curve by seeking information now",
      });
    }
    
    // General 2-year limitation period (Ontario default)
    if (classification.domain === 'civil-negligence' || classification.domain === 'insurance' || classification.domain === 'employment') {
      const twoYearsDays = 730; // 2 years approx
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = twoYearsDays - daysSinceCreated;
      
      if (daysRemaining < 180) { // Only show if less than 6 months remaining
        generated.push({
          urgency: daysRemaining <= 30 ? 'warning' : 'info',
          daysRemaining: Math.max(0, daysRemaining),
          limitationPeriod: {
            name: 'General Limitation Period',
            period: '2 years',
            description: 'Most civil claims in Ontario must be started within 2 years of discovering the claim',
            consequence: 'After 2 years, you generally lose the right to sue',
            learnMoreUrl: 'https://www.ontario.ca/laws/statute/02l24',
          },
          message: `Approximately ${Math.floor(daysRemaining / 30)} months remaining to start legal action`,
          actionRequired: 'Gather evidence, document timeline, consider consulting a lawyer or paralegal',
          encouragement: 'You have time to prepare your case properly',
        });
      }
    }
    
    // LTB applications (1 year typical)
    if (classification.domain === 'landlordTenant') {
      const oneYearDays = 365;
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = oneYearDays - daysSinceCreated;
      
      if (daysRemaining < 90) {
        generated.push({
          urgency: daysRemaining <= 30 ? 'warning' : 'caution',
          daysRemaining: Math.max(0, daysRemaining),
          limitationPeriod: {
            name: 'LTB Application Period',
            period: '1 year (typical)',
            description: 'Landlord and Tenant Board applications typically must be filed within 1 year of the issue',
            consequence: 'LTB may refuse to hear applications filed too late',
            learnMoreUrl: 'https://tribunalsontario.ca/ltb/',
          },
          message: `Approximately ${Math.floor(daysRemaining / 30)} months to file LTB application`,
          actionRequired: 'Prepare evidence, complete LTB forms, file application',
          encouragement: "You're on top of this - keep moving forward",
        });
      }
    }
    
    return generated;
  }, [classification, matterCreatedAt]);
  
  if (alerts.length === 0) return null;
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Important Deadlines</h2>
      <DeadlineAlerts alerts={alerts} />
    </div>
  );
}
