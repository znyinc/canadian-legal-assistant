export type Pillar = 'Criminal' | 'Civil' | 'Administrative' | 'Quasi-Criminal' | 'Unknown';
export declare class PillarClassifier {
    private matchAny;
    classify(text: string): Pillar;
    detectAllPillars(text: string): Pillar[];
}
//# sourceMappingURL=PillarClassifier.d.ts.map