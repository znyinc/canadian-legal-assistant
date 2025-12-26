export class TimelineGenerator {
    generate(index) {
        const entries = index.items
            .filter((item) => item.date)
            .map((item) => ({
            date: item.date,
            itemId: item.id,
            filename: item.filename,
            type: item.type,
            summary: item.summary
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return entries;
    }
    detectGaps(timeline) {
        const gaps = [];
        for (let i = 0; i < timeline.length - 1; i++) {
            const current = new Date(timeline[i].date);
            const next = new Date(timeline[i + 1].date);
            const durationMs = next.getTime() - current.getTime();
            const durationDays = Math.floor(durationMs / (24 * 60 * 60 * 1000));
            // Flag gaps > 7 days
            if (durationDays > 7) {
                const riskLevel = durationDays > 30 ? 'high' : durationDays > 14 ? 'medium' : 'low';
                gaps.push({
                    start: timeline[i].date,
                    end: timeline[i + 1].date,
                    durationDays,
                    riskLevel
                });
            }
        }
        return gaps;
    }
    flagMissingEvidence(index, timeline) {
        const alerts = [];
        const hasScreenshot = index.items.some((item) => item.type === 'PNG' || item.type === 'JPG');
        const hasEmail = index.items.some((item) => item.type === 'EML');
        const hasCorrespondence = index.items.some((item) => item.type === 'TXT' || item.type === 'EML');
        if (!hasScreenshot && timeline.length > 0) {
            alerts.push({ type: 'screenshot', message: 'No screenshot evidence found; consider adding visual documentation.' });
        }
        if (!hasEmail && timeline.length > 0) {
            alerts.push({
                type: 'email-original',
                message: 'No original emails (EML) found; consider exporting full emails from mail client with headers.'
            });
        }
        if (!hasCorrespondence && timeline.length > 2) {
            alerts.push({
                type: 'unknown',
                message: 'Limited correspondence in evidence; consider adding written communications.'
            });
        }
        return alerts;
    }
}
//# sourceMappingURL=TimelineGenerator.js.map