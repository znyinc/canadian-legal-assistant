import { TemplateLibrary } from '../templates/TemplateLibrary';
export class DocumentPackager {
    templates;
    constructor(templates) {
        this.templates = templates ?? new TemplateLibrary();
    }
    assemble(input) {
        const layout = this.templates.packageLayout();
        const files = [];
        const warnings = [];
        // Required manifest files
        files.push({
            path: 'manifests/source_manifest.json',
            content: JSON.stringify(input.sourceManifest, null, 2)
        });
        files.push({
            path: 'manifests/evidence_manifest.json',
            content: JSON.stringify(input.evidenceManifest, null, 2)
        });
        // Core artifacts
        files.push({ path: 'forum_map.md', content: input.forumMap });
        files.push({ path: 'timeline.md', content: input.timeline });
        files.push({ path: 'missing_evidence.md', content: input.missingEvidenceChecklist });
        if (!input.drafts.length) {
            warnings.push('No draft documents provided.');
        }
        else {
            input.drafts.forEach((draft, idx) => {
                const safeName = this.slugify(draft.title || `draft-${idx + 1}`);
                const body = this.renderDraft(draft);
                files.push({ path: `drafts/${safeName}.md`, content: body });
            });
        }
        // Ensure template-required placeholders exist
        layout.files.forEach((path) => {
            if (!files.find((f) => f.path === path)) {
                files.push({ path, content: '# Placeholder\n' });
                warnings.push(`Added placeholder for missing template file: ${path}`);
            }
        });
        // Include domain templates as separate files for reference
        const domainTemplates = typeof this.templates.domainTemplates === 'function' ? this.templates.domainTemplates() : {};
        Object.entries(domainTemplates).forEach(([id, content]) => {
            const safePath = `templates/${id}.md`;
            if (!files.find((f) => f.path === safePath)) {
                files.push({ path: safePath, content });
            }
        });
        return {
            name: input.packageName,
            folders: layout.folders,
            files,
            sourceManifest: input.sourceManifest,
            evidenceManifest: input.evidenceManifest,
            warnings: warnings.length ? warnings : undefined
        };
    }
    renderDraft(draft) {
        const sections = draft.sections
            .map((section) => {
            const refs = section.evidenceRefs
                .map((r) => `- Attachment ${r.attachmentIndex ?? r.evidenceId}${r.timestamp ? ` (${r.timestamp})` : ''}`)
                .join('\n');
            const confirmation = section.confirmed ? '' : '\n**Confirmation required before sending.**';
            const refsBlock = refs ? `\nEvidence References:\n${refs}` : '';
            return `## ${section.heading}\n${section.content}${confirmation}${refsBlock}`;
        })
            .join('\n\n');
        const disclaimer = draft.disclaimer ? `\n\n> ${draft.disclaimer}` : '';
        const citations = draft.citations
            .map((c) => `- ${c.label}: ${c.url} (retrieved ${c.retrievalDate})`)
            .join('\n');
        const citationsBlock = citations ? `\n\nCitations:\n${citations}` : '';
        const warnings = [];
        if (draft.missingConfirmations?.length)
            warnings.push(...draft.missingConfirmations);
        if (draft.styleWarnings?.length)
            warnings.push(...draft.styleWarnings);
        if (draft.citationWarnings?.length)
            warnings.push(...draft.citationWarnings);
        const warningBlock = warnings.length ? `\n\nWarnings:\n${warnings.map((w) => `- ${w}`).join('\n')}` : '';
        return `# ${draft.title}\n${sections}${citationsBlock}${disclaimer}${warningBlock}`;
    }
    slugify(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-{2,}/g, '-');
    }
}
//# sourceMappingURL=DocumentPackager.js.map