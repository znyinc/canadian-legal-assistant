export interface RetrievalResult<T> {
    ok: boolean;
    data?: T;
    message: string;
}
export declare class RetrievalGuard {
    handle<T>(attempt: () => Promise<T>): Promise<RetrievalResult<T>>;
    failureMessage(service: string, query: string): string;
}
//# sourceMappingURL=RetrievalGuard.d.ts.map