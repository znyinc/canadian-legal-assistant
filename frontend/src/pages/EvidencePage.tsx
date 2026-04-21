import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api, Evidence, Matter, MissingEvidenceAlert, TimelineResponse } from '../services/api';
import { safeText } from '../utils/sanitize';

interface EvidencePageProps {
  matterId: string;
}

export default function EvidencePage({ matterId }: EvidencePageProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [matter, setMatter] = useState<Matter | null>(null);
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatter();
    loadEvidence();
    loadTimeline();
  }, [matterId]);

  const loadMatter = async () => {
    try {
      const data = await api.getMatter(matterId);
      setMatter(data);
    } catch (err) {
      console.error('Failed to load matter:', err);
    }
  };

  const loadEvidence = async () => {
    try {
      const data = await api.listEvidence(matterId);
      setEvidence(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    }
  };

  const loadTimeline = async () => {
    try {
      const data = await api.getTimeline(matterId);
      setTimeline(data);
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<MissingEvidenceAlert[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError('');
    setAlerts([]);

    try {
      for (const file of acceptedFiles) {
        setProgressMap((p) => ({ ...p, [file.name]: 0 }));
        const res = await api.uploadEvidence(matterId, file, (percent) => {
          setProgressMap((p) => ({ ...p, [file.name]: percent }));
        });

        // show any alerts returned (redaction, municipal flags, missing metadata)
        if (res.alerts && res.alerts.length) {
          setAlerts((a) => [...a, ...res.alerts]);
        }
        if (res.redactedPreview) {
          setAlerts((a) => [...a, { type: 'unknown', message: `Redaction preview: ${res.redactedPreview}` }]);
        }
      }
      await loadEvidence();
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgressMap({});
    }
  }, [matterId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'message/rfc822': ['.eml'],
      'application/vnd.ms-outlook': ['.msg'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const parsedClassification = (() => {
    if (!matter?.classification) {
      return null;
    }

    try {
      return JSON.parse(matter.classification);
    } catch {
      return null;
    }
  })();
  const strategyDomain = parsedClassification?.domain || matter?.domain || 'other';

  const evidenceDetails = evidence.map((item) => {
    if (!item.evidenceIndex) {
      return { item, indexItem: null as any };
    }

    try {
      const parsed = JSON.parse(item.evidenceIndex);
      const indexItem = Array.isArray(parsed?.items)
        ? parsed.items.find((candidate: { filename?: string }) => candidate.filename === item.filename) || parsed.items[parsed.items.length - 1]
        : parsed;
      return { item, indexItem };
    } catch {
      return { item, indexItem: null as any };
    }
  });

  const getDomainGuidance = (domain: string) => {
    switch (domain) {
      case 'legalMalpractice':
        return [
          'Prioritize the retainer agreement, emails with the lawyer, missed-deadline notices, and any file transfer records.',
          'Keep the original evidence from the lost underlying claim so you can still prove the case-within-a-case.',
          'Add dated communications that show when you discovered the missed deadline because that affects limitation analysis.',
        ];
      case 'civil-negligence':
      case 'civilNegligence':
      case 'municipalPropertyDamage':
        return [
          'Photos, repair estimates, invoices, and dated correspondence usually matter more than general summaries.',
          'If there is property damage, add before-and-after visuals and any notice letters sent to the other side or municipality.',
          'Try to fill date gaps with receipts, inspection notes, and messages that anchor the chronology.',
        ];
      case 'employment':
        return [
          'Termination letters, pay records, schedules, and written employer communications are usually core evidence.',
          'If the dispute is about dismissal or unpaid wages, anchor the timeline with exact work dates and payment dates.',
          'Original emails and exported messages are stronger than screenshots alone when employment facts are disputed.',
        ];
      case 'landlordTenant':
        return [
          'Lease terms, notices, rent records, photos of conditions, and written landlord-tenant communications should be grouped together.',
          'Add any dated notices first because LTB issues often turn on notice periods and sequence.',
          'If repairs or condition issues matter, photos paired with complaint messages are stronger than either on their own.',
        ];
      case 'consumerProtection':
        return [
          'Receipts, contracts, ad screenshots, cancellation requests, and chargeback correspondence usually carry the most weight.',
          'Keep the original timeline of promises, payments, and failed resolutions in order.',
          'Where possible, upload both the promotional claim and the later communication that contradicts it.',
        ];
      case 'criminal':
        return [
          'Medical records, photos, police occurrence details, and preserved messages usually strengthen the factual timeline.',
          'Use dated records to show what happened before, during, and after the incident.',
          'Original message exports are stronger than summaries when threats or repeated contact are disputed.',
        ];
      default:
        return [
          'Lead with the most dated and original records so the chronology is easier to verify.',
          'Try to pair each key event with a document, message, photo, or receipt that proves it happened.',
          'Where the story jumps forward, add records that explain what happened in between.',
        ];
    }
  };

  const strategyGuidance = getDomainGuidance(strategyDomain);
  const stats = timeline?.stats;
  const gapCount = timeline?.gaps?.length || 0;
  const alertCount = timeline?.alerts?.length || 0;
  const sortedAlerts = (timeline?.alerts || alerts).filter(Boolean) as MissingEvidenceAlert[];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evidence Strategy</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-700">
              Use this page to strengthen the record, not just store files. Build a dated chronology, fill long gaps, and add the original records that best support the next decision point.
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white px-3 py-3 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Files</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{stats?.totalEvidence ?? evidence.length}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-3 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Dated Events</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{stats?.datedEvents ?? timeline?.events.length ?? 0}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-3 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Chronology Gaps</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{gapCount}</div>
            </div>
            <div className="rounded-lg bg-white px-3 py-3 text-center shadow-sm">
              <div className="text-xs uppercase tracking-wide text-gray-500">Missing Signals</div>
              <div className="mt-1 text-xl font-semibold text-gray-900">{alertCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">What to strengthen next</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {strategyGuidance.map((line) => (
                <li key={line} className="rounded-lg bg-white px-4 py-3 shadow-sm">
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-900">Evidence mix</h3>
            {stats && Object.keys(stats.evidenceTypes).length > 0 ? (
              <div className="mt-3 space-y-2">
                {Object.entries(stats.evidenceTypes).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
                    <span className="text-sm font-medium text-gray-800">{type}</span>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                ))}
                {(stats.undatedEvidence ?? 0) > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                    {stats.undatedEvidence} file{stats.undatedEvidence === 1 ? '' : 's'} do not have an extracted date yet. Add date-anchored records if the sequence matters.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                Upload a few files to start seeing chronology and evidence-mix guidance.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-600">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supported: PDF, PNG, JPG, EML, MSG, TXT (max 10MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {sortedAlerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">Missing Evidence And Record Quality Alerts</p>
          <ul className="text-sm text-yellow-800 space-y-1">
            {sortedAlerts.map((alert, idx) => (
              <li key={`${alert.type}-${idx}`}>• {safeText(alert.message)}</li>
            ))}
          </ul>
        </div>
      )}

      {timeline?.gaps && timeline.gaps.length > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-orange-900 font-medium mb-2">Chronology Gaps To Close</p>
          <div className="space-y-2 text-sm text-orange-900">
            {timeline.gaps.map((gap) => (
              <div key={`${gap.start}-${gap.end}`} className="rounded-lg bg-white px-4 py-3">
                <p className="font-medium">
                  {gap.durationDays} day gap between {new Date(gap.start).toLocaleDateString()} and {new Date(gap.end).toLocaleDateString()}
                </p>
                <p className="mt-1 text-orange-800">
                  Risk level: {gap.riskLevel}. Try to add records that explain what happened in this period.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence List */}
      {evidence.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Uploaded Evidence</h2>
            <p className="mt-1 text-sm text-gray-600">
              Review each file for date coverage, original-format strength, and whether it anchors a key event in the story.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {evidenceDetails.map(({ item, indexItem }) => {
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">{safeText(item.filename)}</p>
                        {indexItem?.type && (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {indexItem.type}
                          </span>
                        )}
                        {indexItem?.date && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                            Dated record
                          </span>
                        )}
                      </div>
                      {indexItem?.summary && (
                        <p className="text-sm text-gray-600 mt-1">{safeText(indexItem.summary)}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                        <span>Uploaded {new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                        {indexItem?.date && (
                          <span>Event date: {new Date(indexItem.date).toLocaleDateString()}</span>
                        )}
                        {typeof indexItem?.credibilityScore === 'number' && (
                          <span>Credibility: {Math.round(indexItem.credibilityScore * 100)} / 100</span>
                        )}
                      </div>

                      {/* Show upload progress if available */}
                      {progressMap[item.filename] !== undefined && (
                        <div className="mt-2">
                          <progress
                            className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-blue-600 [&::-moz-progress-bar]:bg-blue-600"
                            max={100}
                            value={progressMap[item.filename]}
                          />
                          <p className="text-xs text-gray-500 mt-1">Uploading: {progressMap[item.filename]}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && timeline.events && timeline.events.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Evidence Timeline</h2>
          <p className="mb-4 text-sm text-gray-600">
            This chronology is strongest when each key step is supported by a dated original record.
          </p>
          <div className="space-y-4">
            {timeline.events.map((event, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{safeText(event.event)}</p>
                  {event.filename && (
                    <p className="mt-1 text-sm text-gray-500">Source: {safeText(event.filename)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
