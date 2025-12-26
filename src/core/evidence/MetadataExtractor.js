export function extractMetadata(type, content) {
    const text = content.toString('utf-8');
    const meta = {};
    if (type === 'EML') {
        const dateMatch = text.match(/^Date:\s*(.+)$/mi);
        const fromMatch = text.match(/^From:\s*(.+)$/mi);
        const toMatch = text.match(/^To:\s*(.+)$/mi);
        const subjMatch = text.match(/^Subject:\s*(.+)$/mi);
        if (dateMatch)
            meta.date = normalizeDate(dateMatch[1]);
        if (fromMatch)
            meta.sender = fromMatch[1].trim();
        if (toMatch)
            meta.recipient = toMatch[1].trim();
        if (subjMatch)
            meta.subject = subjMatch[1].trim();
    }
    else if (type === 'TXT') {
        // Try to find an ISO-like date in text
        const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2})Z?)?/);
        if (isoMatch)
            meta.date = `${isoMatch[1]}${isoMatch[2] ? 'T' + isoMatch[2] : ''}`;
        meta.summary = text.slice(0, 200);
    }
    else {
        // For binary types, keep minimal metadata placeholder
        meta.summary = undefined;
    }
    return meta;
}
function normalizeDate(s) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
}
//# sourceMappingURL=MetadataExtractor.js.map