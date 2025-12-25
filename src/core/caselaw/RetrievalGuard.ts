export interface RetrievalResult<T> {
  ok: boolean;
  data?: T;
  message: string;
}

export class RetrievalGuard {
  handle<T>(attempt: () => Promise<T>): Promise<RetrievalResult<T>> {
    return attempt()
      .then((data) => ({ ok: true, data, message: 'Retrieved successfully.' }))
      .catch((err) => ({ ok: false, message: `Retrieval failed: ${err?.message || err}` }));
  }

  failureMessage(service: string, query: string): string {
    return `Could not retrieve from ${service} for query "${query}". Provide citation if available or try later.`;
  }
}
