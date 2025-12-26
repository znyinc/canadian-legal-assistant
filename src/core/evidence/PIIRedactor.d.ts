export type PiiFinding = {
    type: 'email' | 'phone' | 'sin' | 'dob' | 'account';
    match: string;
};
export type RedactionResult = {
    redacted: string;
    findings: PiiFinding[];
};
export declare function redactPII(text: string): RedactionResult;
//# sourceMappingURL=PIIRedactor.d.ts.map