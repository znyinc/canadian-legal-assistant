export class JourneyTracker {
    buildProgress(ctx) {
        const steps = [
            {
                id: 'Understand',
                label: 'Understand',
                status: 'done',
                nextSteps: ['Confirm the facts you provided are accurate', 'Clarify missing details if the system prompts you']
            },
            {
                id: 'Options',
                label: 'Options',
                status: 'active',
                nextSteps: ['Review recommended forums and pathways', 'Note deadlines or notice requirements']
            },
            {
                id: 'Prepare',
                label: 'Prepare',
                status: 'pending',
                nextSteps: ['Upload evidence and organize key dates', 'Fill missing evidence gaps and collect contact details for witnesses']
            },
            {
                id: 'Act',
                label: 'Act',
                status: 'pending',
                nextSteps: ['Generate drafts, review for accuracy, and prepare to file or send', 'Follow filing or submission instructions for the forum']
            },
            {
                id: 'Resolve',
                label: 'Resolve',
                status: 'pending',
                nextSteps: ['Track responses, deadlines, and next hearings', 'Record outcomes and consider appeals or compliance steps if needed']
            }
        ];
        const evidenceCount = ctx.evidenceCount ?? 0;
        const documentsGenerated = !!ctx.documentsGenerated;
        // If classification and forum map exist, move to Options as done
        const hasClassification = !!ctx.classification && !!ctx.classification.domain;
        const hasForum = !!ctx.forumMap;
        if (hasClassification && hasForum) {
            this.markDone(steps, 'Options');
        }
        // Evidence uploaded moves Prepare to done
        if (evidenceCount > 0) {
            this.markDone(steps, 'Prepare');
        }
        // Documents generated moves Act to done
        if (documentsGenerated) {
            this.markDone(steps, 'Act');
        }
        // If everything else is done, Resolve becomes active
        const unresolved = steps.filter((s) => s.status !== 'done');
        if (unresolved.length === 1 && unresolved[0].id === 'Resolve') {
            unresolved[0].status = 'active';
        }
        else {
            const firstPending = steps.find((s) => s.status === 'pending');
            const firstActive = steps.find((s) => s.status === 'active');
            if (!firstActive && firstPending) {
                firstPending.status = 'active';
            }
        }
        const percentComplete = Math.round((steps.filter((s) => s.status === 'done').length / steps.length) * 100);
        const currentStage = (steps.find((s) => s.status === 'active') || steps.find((s) => s.status === 'pending') || steps[0]).id;
        return { currentStage, percentComplete, steps };
    }
    markDone(steps, id) {
        const step = steps.find((s) => s.id === id);
        if (!step)
            return;
        step.status = 'done';
        const next = steps.find((s) => s.status === 'pending');
        if (next) {
            next.status = 'active';
        }
    }
}
//# sourceMappingURL=JourneyTracker.js.map