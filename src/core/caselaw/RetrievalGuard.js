export class RetrievalGuard {
    handle(attempt) {
        return attempt()
            .then((data) => ({ ok: true, data, message: 'Retrieved successfully.' }))
            .catch((err) => ({ ok: false, message: `Retrieval failed: ${err?.message || err}` }));
    }
    failureMessage(service, query) {
        return `Could not retrieve from ${service} for query "${query}". Provide citation if available or try later.`;
    }
}
//# sourceMappingURL=RetrievalGuard.js.map