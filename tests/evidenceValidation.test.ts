import { describe, it, expect } from 'vitest';
import { validateFile } from '../src/core/evidence/Validator';

function buf(str: string) { return Buffer.from(str, 'binary'); }

describe('Evidence validators', () => {
  it('validates PDF header', () => {
    const res = validateFile('doc.pdf', buf('%PDF-1.7\n...'));
    expect(res.ok).toBe(true);
    expect(res.type).toBe('PDF');
  });
  it('validates PNG header', () => {
    const res = validateFile('img.png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]));
    expect(res.ok).toBe(true);
    expect(res.type).toBe('PNG');
  });
  it('validates JPEG header', () => {
    const res = validateFile('photo.jpg', Buffer.from([0xff, 0xd8, 0xff, 0x00]));
    expect(res.ok).toBe(true);
    expect(res.type).toBe('JPG');
  });
  it('validates EML headers', () => {
    const content = `From: alice@example.com\nTo: bob@example.com\nDate: Wed, 01 Jan 2025 12:00:00 -0500\nSubject: Test\n\nBody`;
    const res = validateFile('mail.eml', Buffer.from(content, 'utf-8'));
    expect(res.ok).toBe(true);
    expect(res.type).toBe('EML');
  });
  it('validates MSG via OLE header', () => {
    const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    const res = validateFile('mail.msg', ole);
    expect(res.ok).toBe(true);
    expect(res.type).toBe('MSG');
  });
  it('accepts TXT without checks', () => {
    const res = validateFile('note.txt', Buffer.from('hello', 'utf-8'));
    expect(res.ok).toBe(true);
    expect(res.type).toBe('TXT');
  });
});
