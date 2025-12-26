import { EvidenceType } from '../models';
export type ValidationResult = {
    ok: boolean;
    type?: EvidenceType;
    errors?: string[];
};
export declare function validateFile(filename: string, content: Buffer): ValidationResult;
//# sourceMappingURL=Validator.d.ts.map