import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { api, Matter } from '../services/api';
import { safeText } from '../utils/sanitize';
import EvidencePage from './EvidencePage';
import DocumentsPage from './DocumentsPage';
import AdvisorResponseView, { CaseProfile, ActionPlan as AdvisorActionPlan } from '../components/AdvisorResponseView';

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [forumMap, setForumMap] = useState<any>(null);
  // Removed unused state variables per action-first UX restructure
  // const [pillarExplanation, setPillarExplanation] = useState<any>(null);
  // const [pillarMatches, setPillarMatches] = useState<string[] | null>(null);
  // const [pillarAmbiguous, setPillarAmbiguous] = useState<boolean>(false);
  // const [deadlineAlerts, setDeadlineAlerts] = useState<any[] | null>(null);
  // const [uplBoundaries, setUplBoundaries] = useState<any | null>(null);
  // const [adviceRedirect, setAdviceRedirect] = useState<any | null>(null);
  // const [sandboxPlan, setSandboxPlan] = useState<any | null>(null);
  // const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState('');
  const [generatingForm7A, setGeneratingForm7A] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadMatter();
    }
  }, [id]);

  const loadMatter = async () => {
    if (!id) return;

    try {
      const data = await api.getMatter(id);
      setMatter(data);

      if (data.classification) {
        const c = JSON.parse(data.classification);
        setClassification(c);
        // Removed setter calls for unused state variables
        // if (c.pillarExplanation) setPillarExplanation(c.pillarExplanation);
        // if (Array.isArray(c.pillarMatches)) setPillarMatches(c.pillarMatches);
        // if (c.pillarAmbiguous) setPillarAmbiguous(!!c.pillarAmbiguous);
        // if (Array.isArray(c.deadlineAlerts)) setDeadlineAlerts(c.deadlineAlerts);
        // if (c.uplBoundaries) setUplBoundaries(c.uplBoundaries);
        // if (c.adviceRedirect) setAdviceRedirect(c.adviceRedirect);
        // if (c.sandboxPlan) setSandboxPlan(c.sandboxPlan);
        // if (c.journey) setJourney(c.journey);
      }
      if (data.forumMap) {
        setForumMap(JSON.parse(data.forumMap));
      }

      // Auto-classify if not already classified
      if (!data.classification || !data.forumMap) {
        await handleClassify();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matter');
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!id) return;
    
    setClassifying(true);
    try {
      const result = await api.classifyMatter(id);
      const classificationWithAlerts = {
        ...result.classification,
        ...(result.deadlineAlerts ? { deadlineAlerts: result.deadlineAlerts } : {}),
      };
      setClassification(classificationWithAlerts);
      setForumMap(result.forumMap);
      // Removed setter calls for unused state variables (pillar, journey, etc. now in classification object)
      // if (result.pillarExplanation) setPillarExplanation(result.pillarExplanation);
      // if (Array.isArray(result.pillarMatches)) setPillarMatches(result.pillarMatches);
      // if (typeof result.pillarAmbiguous !== 'undefined') setPillarAmbiguous(!!result.pillarAmbiguous);
      // if (Array.isArray(result.deadlineAlerts)) setDeadlineAlerts(result.deadlineAlerts);
      // if (result.uplBoundaries) setUplBoundaries(result.uplBoundaries);
      // if (result.adviceRedirect) setAdviceRedirect(result.adviceRedirect);
      // if (result.sandboxPlan) setSandboxPlan(result.sandboxPlan);
      // if (result.journey) setJourney(result.journey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setClassifying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading matter...</div>;
  }

  if (error || !matter) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error || 'Matter not found'}</p>
      </div>
    );
  }

  const isOverviewPage = location.pathname === `/matters/${id}` || location.pathname === `/matters/${id}/`;

  const handleGenerateForm7A = async () => {
    if (!id) return;
    setGeneratingForm7A(true);
    try {
      await api.generateDocuments(id, undefined, ['civil/small_claims_form7a']);
      // navigate to documents tab to let user download
      navigate(`/matters/${id}/documents`);
    } catch (err) {
      console.error('Generate Form 7A failed', err);
      alert('Failed to generate Form 7A');
    } finally {
      setGeneratingForm7A(false);
    }
  };

  const handleGenerateDocument = async (documentType: string) => {
    if (!id) return;
    try {
      if (documentType === 'complete_package') {
        await api.generateDocuments(id);
      } else {
        await api.generateDocuments(id, undefined, [documentType]);
      }
      navigate(`/matters/${id}/documents`);
    } catch (err) {
      console.error('Generate document failed', err);
      alert('Failed to generate document');
    }
  };

  const actionPlan: AdvisorActionPlan | null = classification?.actionPlan || null;

  const buildCaseProfile = (): CaseProfile => {
    const domain = classification?.domain;
    
    // Generate conversational plain-English summary
    const generatePlainSummary = (): string => {
      if (domain === 'legalMalpractice') {
        return "Here's what happened: You hired a lawyer to handle your case, but they missed a critical deadline - the date by which your lawsuit had to be filed. You only discovered this mistake recently when you checked in on your case. Because the deadline passed, you can't pursue the original lawsuit anymore. But here's the thing - you might be able to sue your lawyer for messing up your case. That's called legal malpractice.";
      }
      
      if (domain === 'criminal') {
        return "You're involved in a criminal matter. This means the police have laid charges, and the Crown Attorney (the government's lawyer) will decide whether to proceed with the case. You're not the one suing - you're a witness helping the Crown prove what happened. The court process has specific timelines and steps, and there are support services available to help you through it.";
      }
      
      if (domain === 'civil-negligence' || domain === 'municipalPropertyDamage') {
        return "Someone's negligence caused you harm or property damage. You're considering whether to pursue compensation through the courts. Before going to court, you'll typically need to try settling directly - send a demand letter, gather evidence, and give the other party a chance to make things right. If that doesn't work, you can file a lawsuit in Small Claims Court (for claims under $50,000) or Superior Court (for larger claims).";
      }
      
      if (domain === 'landlordTenant') {
        return "You're having a dispute with your landlord or tenant. The good news: Ontario has the Landlord and Tenant Board (LTB), which is an informal tribunal designed to resolve these issues without needing a lawyer. The LTB hears cases about rent, repairs, evictions, and lease disputes. Most cases settle before a hearing, but if they don't, you'll present your evidence to a tribunal member who will make a decision.";
      }
      
      if (domain === 'employment') {
        return "You're dealing with an employment issue - maybe you were fired without proper notice, your employer owes you wages, or you're facing workplace discrimination. You have a few options: file a free complaint with the Ministry of Labour for things like unpaid wages or unsafe conditions, or pursue a civil lawsuit for wrongful dismissal. The right path depends on what you're claiming and how much is at stake.";
      }
      
      if (domain === 'consumerProtection') {
        return "You bought something or hired a service, and it didn't go as promised. Maybe you were misled, charged for things you didn't agree to, or the product/service was defective. Consumer Protection Ontario investigates complaints about unfair business practices, but they don't award compensation - for that, you'd need to go to Small Claims Court or request a chargeback from your credit card company.";
      }
      
      // Generic fallback
      return "You're dealing with a legal situation that has you wondering what to do next. The good news is that legal issues can be broken down into clear, manageable steps. You'll need to gather your evidence, understand the timelines and deadlines, figure out which forum handles your type of case (court, tribunal, or informal resolution), and decide whether to settle or pursue formal action.";
    };
    
    if (domain === 'legalMalpractice') {
      return {
        empathyHook:
          actionPlan?.acknowledgment ||
          "You've discovered your lawyer missed a critical deadline. That's a gut-punch, and it's okay to feel frustrated.",
        plainSummary: generatePlainSummary(),
        keyInsight:
          'Missing the deadline may have ended the original case, but it can create a new malpractice claim with clearer liability.',
        keyInsightCaseLawSearch: 'Grant Thornton discoverability limitation Ontario',
        keyInsightCaseLawTooltip: 'Grant Thornton LLP v. New Brunswick, 2021 SCC 31 (discoverability rule).',
        lostVsGained: [
          { lost: 'Right to sue the original defendant', gained: 'Potential malpractice claim against your lawyer' },
          { lost: 'Uncertain slip-and-fall negligence case', gained: 'Clear missed-deadline proof' },
          { lost: 'Defendant who may dispute liability', gained: 'Lawyer with mandatory malpractice insurance (LawPRO)' },
        ],
        thingsToKnow: [
          { title: 'Case within a case', detail: 'You must show the original case likely would have won and the lawyer breached their duty.' },
          {
            title: 'New 2-year clock',
            detail: 'The malpractice limitation runs from discovery — do not let this one slip.',
            caseLawSearch: 'Grant Thornton discoverability limitation Ontario',
            tooltip: 'Grant Thornton LLP v. New Brunswick, 2021 SCC 31 clarifies discoverability for the 2-year clock.'
          },
          { title: 'Insurance exists', detail: 'Ontario lawyers carry LawPRO coverage, improving collectability.' },
        ],
      };
    }

    return {
      empathyHook:
        actionPlan?.acknowledgment ||
        "You’re dealing with a legal issue that can feel heavy, but we can break this into clear, doable steps.",
      plainSummary: generatePlainSummary(),
      keyInsight: 'You have options and timelines. Acting in order will reduce risk and stress.',
      lostVsGained: [
        { lost: 'Unclear next steps', gained: 'Prioritized actions with timeframes' },
        { lost: 'Guessing the forum', gained: forumMap?.primaryForum?.name || 'Likely forum guidance' },
        { lost: 'Scattered documents', gained: 'Targeted documents you can generate' },
      ],
      thingsToKnow: [
        { title: 'Deadlines drive strategy', detail: 'Tackle urgent items first to protect your position.' },
        { title: 'Evidence matters', detail: 'Collect and organize records early; it makes every step easier.' },
        { title: 'Pathways differ', detail: 'Tribunal vs court vs settlement each has trade-offs — choose deliberately.' },
      ],
    };
  };

  const generateOptions = (actionPlan?.nextStepOffers || []).map((offer: any) => ({
    label: offer.actionLabel || offer.title,
    documentType: offer.documentType || offer.id,
    description: offer.description,
  }));

  return (
    <div>
      {/* Matter Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
            {matter.domain}
          </span>
          <span className="text-sm text-gray-500">{matter.province}</span>
          {classification && (
            <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
              Classified
            </span>
          )}
        </div>
        <p className="text-gray-900 mb-2">{safeText(matter.description)}</p>
        <p className="text-sm text-gray-500">
          Created {new Date(matter.createdAt).toLocaleDateString()}
        </p>

        {/* Quick action for civil matters: Generate Form 7A */}
        {classification?.domain === 'civil-negligence' && (
          <div className="mt-4">
            <button
              onClick={handleGenerateForm7A}
              disabled={generatingForm7A}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {generatingForm7A ? 'Generating Form 7A...' : 'Generate Form 7A'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6" role="tablist" aria-label="Matter details">
        <nav className="flex gap-4">
          <Link
            to={`/matters/${id}`}
            role="tab"
            aria-selected={isOverviewPage}
            aria-controls="overview-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isOverviewPage
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </Link>
          <Link
            to={`/matters/${id}/evidence`}
            role="tab"
            aria-selected={location.pathname.includes('/evidence')}
            aria-controls="evidence-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/evidence')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Evidence
          </Link>
          <Link
            to={`/matters/${id}/documents`}
            role="tab"
            aria-selected={location.pathname.includes('/documents')}
            aria-controls="documents-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/documents')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Documents
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route
          index
          element={
            <div className="space-y-4">
              {(!classification || !actionPlan) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 mb-3">Classification pending. Run it to unlock tailored next steps.</p>
                  <button
                    onClick={handleClassify}
                    disabled={classifying}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {classifying ? 'Classifying...' : 'Classify with AI'}
                  </button>
                </div>
              )}
              <AdvisorResponseView
                caseProfile={buildCaseProfile()}
                classification={classification}
                actionPlan={actionPlan}
                onGenerate={handleGenerateDocument}
                generateOptions={generateOptions}
              />
            </div>
          }
        />
        <Route path="evidence" element={<EvidencePage matterId={id!} />} />
        <Route path="documents" element={<DocumentsPage matterId={id!} />} />
      </Routes>
    </div>
  );
}
