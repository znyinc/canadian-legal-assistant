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
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Matters
  async createMatter(data: {
    description: string;
    province: string;
    domain: string;
    disputeAmount?: number;
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
    file: File
  ): Promise<{ evidence: Evidence; timeline: any; gaps: any[]; alerts: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/evidence/${matterId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
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
    userConfirmedFacts?: string[]
  ): Promise<any> {
    return this.request<any>(`/documents/${matterId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ userConfirmedFacts }),
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
