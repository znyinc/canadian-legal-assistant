const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface Matter {
  id: string;
  createdAt: string;
  description: string;
  province: string;
  domain: string;
  disputeAmount?: number;
  classification?: string;
  forumMap?: string;
}

export interface Evidence {
  id: string;
  filename: string;
  createdAt: string;
  fileSize: number;
  evidenceIndex?: string;
}

export interface ClassificationResult {
  classification: any;
  forumMap: any;
  nextSteps: string[];
  pillar?: string;
  pillarMatches?: string[];
  pillarAmbiguous?: boolean;
  pillarExplanation?: {
    burdenOfProof: string;
    overview: string;
    nextSteps: string[];
  };
  deadlineAlerts?: {
    urgency: 'critical' | 'warning' | 'caution' | 'info';
    daysRemaining: number;
    limitationPeriod: {
      name: string;
      period: string;
      description: string;
      consequence: string;
      learnMoreUrl?: string;
    };
    message: string;
    actionRequired: string;
    encouragement?: string;
  }[];
  ocppWarnings?: string[];
  journey?: {
    currentStage: string;
    percentComplete: number;
    steps: { id: string; label: string; status: string; nextSteps: string[] }[];
  };
  uplBoundaries?: {
    audience: string;
    jurisdiction: string;
    canDo: string[];
    cannotDo: string[];
    safeHarbor: string;
    examples: { request: string; redirect: string }[];
  };
  adviceRedirect?: {
    redirected: boolean;
    message: string;
    options: string[];
    safeHarbor: string;
    tone: 'gentle' | 'firm';
  };
  sandboxPlan?: {
    tier: string;
    label: string;
    rationale: string;
    actions: string[];
    humanReview: { required: boolean; reason?: string; steps: string[] };
    auditTrail: string[];
    controls: string[];
  };
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const err = new Error(error.error || 'Request failed') as any;
      err.details = error.details;
      throw err;
    }

    return response.json();
  }

  // Matters
  async createMatter(data: {
    description: string;
    province: string;
    domain: string;
    disputeAmount?: number;
    structuredAnswers?: any[];
    variables?: Record<string, string | number | boolean>;
  }): Promise<Matter> {
    return this.request<Matter>('/matters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMatter(id: string): Promise<Matter> {
    return this.request<Matter>(`/matters/${id}`);
  }

  async listMatters(): Promise<Matter[]> {
    return this.request<Matter[]>('/matters');
  }

  async classifyMatter(id: string): Promise<ClassificationResult> {
    return this.request<ClassificationResult>(`/matters/${id}/classify`, {
      method: 'POST',
    });
  }

  async deleteMatter(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/matters/${id}`, {
      method: 'DELETE',
    });
  }

  // Evidence
  async uploadEvidence(
    matterId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ evidence: Evidence; timeline: any; gaps: any[]; alerts: any[]; redactedPreview?: string }> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE}/evidence/${matterId}`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (err) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  }

  async listEvidence(matterId: string): Promise<Evidence[]> {
    return this.request<Evidence[]>(`/evidence/${matterId}`);
  }

  async getTimeline(matterId: string): Promise<{ events: any[] }> {
    return this.request<{ events: any[] }>(`/evidence/${matterId}/timeline`);
  }

  // Documents
  async generateDocuments(
    matterId: string,
    userConfirmedFacts?: string[],
    requestedTemplates?: string[]
  ): Promise<any> {
    return this.request<any>(`/documents/${matterId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ userConfirmedFacts, requestedTemplates }),
    });
  }

  async listDocuments(matterId: string): Promise<any[]> {
    return this.request<any[]>(`/documents/${matterId}/documents`);
  }

  // Audit
  async getAuditLog(matterId?: string): Promise<any[]> {
    const query = matterId ? `?matterId=${matterId}` : '';
    return this.request<any[]>(`/audit${query}`);
  }

  // Case Law
  async searchCaselaw(query: string): Promise<any> {
    return this.request<any>(`/caselaw/search?query=${encodeURIComponent(query)}`);
  }

  async getStatuteCitation(title: string, year?: number, section?: string): Promise<any> {
    let url = `/caselaw/statute?title=${encodeURIComponent(title)}`;
    if (year) url += `&year=${year}`;
    if (section) url += `&section=${encodeURIComponent(section)}`;
    return this.request<any>(url);
  }

  async getCourtGuidance(court: string): Promise<any> {
    return this.request<any>(`/caselaw/court-guidance?court=${encodeURIComponent(court)}`);
  }
}

export const api = new ApiClient();
