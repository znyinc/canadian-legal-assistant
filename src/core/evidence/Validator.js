const MAGIC = {
    PDF: Buffer.from('%PDF'),
    PNG: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    JPG: Buffer.from([0xff, 0xd8, 0xff]),
    MSG: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) // OLE header
};
function ext(path) {
    const idx = path.lastIndexOf('.');
    return idx >= 0 ? path.substring(idx + 1).toLowerCase() : '';
}
export function validateFile(filename, content) {
    const e = ext(filename);
    const errors = [];
    switch (e) {
        case 'pdf': {
            const ok = content.slice(0, MAGIC.PDF.length).equals(MAGIC.PDF);
            return { ok, type: 'PDF', errors: ok ? [] : ['Invalid PDF header'] };
        }
        case 'png': {
            const ok = content.slice(0, MAGIC.PNG.length).equals(MAGIC.PNG);
            return { ok, type: 'PNG', errors: ok ? [] : ['Invalid PNG header'] };
        }
        case 'jpg':
        case 'jpeg': {
            const ok = content.slice(0, MAGIC.JPG.length).equals(MAGIC.JPG);
            return { ok, type: 'JPG', errors: ok ? [] : ['Invalid JPEG header'] };
        }
        case 'eml': {
            const text = content.toString('utf-8');
            const ok = /^(From:|Date:|Subject:|To:)/m.test(text);
            return { ok, type: 'EML', errors: ok ? [] : ['EML missing standard headers'] };
        }
        case 'msg': {
            const ok = content.slice(0, MAGIC.MSG.length).equals(MAGIC.MSG);
            return { ok, type: 'MSG', errors: ok ? [] : ['MSG missing OLE header'] };
        }
        case 'txt': {
            return { ok: true, type: 'TXT' };
        }
        default:
            errors.push('Unsupported extension');
            return { ok: false, errors };
    }
}
//# sourceMappingURL=Validator.js.map