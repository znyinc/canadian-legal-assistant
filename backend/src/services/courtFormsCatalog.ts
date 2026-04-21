import fs from 'fs';
import path from 'path';

export interface CourtFormEntry {
  filename: string;
  absolutePath: string;
  extension: string;
  lastModifiedAt: string;
  sizeBytes: number;
}

export interface CourtFormsCatalogSnapshot {
  refreshedAt: string;
  rootPath: string;
  totalFiles: number;
  entries: CourtFormEntry[];
}

export interface CourtFormMatchOptions {
  domain?: string;
  forceRefresh?: boolean;
}

type KnownFormId =
  | 'form-7a-small-claims'
  | 'ltb-form-t1'
  | 'ltb-form-l1'
  | 'victim-impact-statement';

interface MatcherBundle {
  primary: RegExp[];
  supporting?: RegExp[];
}

const FORM_MATCHERS: Record<KnownFormId, MatcherBundle> = {
  'form-7a-small-claims': {
    primary: [/^14a-statement-claim/i, /statement-claim/i],
    supporting: [/^16b-affidavit-service/i, /^49a-offer-settle/i, /^49c-acceptance-offer/i],
  },
  'ltb-form-t1': {
    primary: [/^t1\b/i, /tenant-application/i],
  },
  'ltb-form-l1': {
    primary: [/^l1\b/i, /landlord-application/i, /non-payment/i],
  },
  'victim-impact-statement': {
    primary: [/victim-impact/i],
  },
};

const DOMAIN_MATCHERS: Record<string, MatcherBundle> = {
  'civil-negligence': {
    primary: [/^14a-statement-claim/i, /^16b-affidavit-service/i],
    supporting: [/^49a-offer-settle/i, /^49c-acceptance-offer/i, /^37a-notice-motion/i],
  },
  legalMalpractice: {
    primary: [/^14a-statement-claim/i, /^16b-affidavit-service/i],
    supporting: [/^49a-offer-settle/i, /^49c-acceptance-offer/i, /^37a-notice-motion/i],
  },
  consumerProtection: {
    primary: [/^14a-statement-claim/i],
    supporting: [/^49a-offer-settle/i, /^16b-affidavit-service/i],
  },
  insurance: {
    primary: [/^14a-statement-claim/i],
    supporting: [/^49a-offer-settle/i, /^16b-affidavit-service/i],
  },
  criminal: {
    primary: [/victim-impact/i],
  },
};

export class CourtFormsCatalog {
  private readonly rootPath: string;
  private readonly refreshIntervalMs: number;
  private cache: CourtFormsCatalogSnapshot | null = null;
  private lastRefreshAt = 0;

  constructor(rootPath?: string, refreshIntervalMs = 24 * 60 * 60 * 1000) {
    this.rootPath = rootPath ?? path.resolve(process.cwd(), '..', 'court-forms');
    this.refreshIntervalMs = refreshIntervalMs;
  }

  getSnapshot(forceRefresh = false): CourtFormsCatalogSnapshot {
    if (!forceRefresh && this.cache && Date.now() - this.lastRefreshAt < this.refreshIntervalMs) {
      return this.cache;
    }

    const entries = this.scanDirectory();
    this.cache = {
      refreshedAt: new Date().toISOString(),
      rootPath: this.rootPath,
      totalFiles: entries.length,
      entries,
    };
    this.lastRefreshAt = Date.now();
    return this.cache;
  }

  findMatches(formIds: string[], options: CourtFormMatchOptions = {}): CourtFormEntry[] {
    const snapshot = this.getSnapshot(options.forceRefresh);
    const matched = new Map<string, CourtFormEntry>();

    const addMatches = (bundle?: MatcherBundle) => {
      if (!bundle) return;

      [...bundle.primary, ...(bundle.supporting || [])].forEach((pattern) => {
        snapshot.entries.forEach((entry) => {
          if (pattern.test(entry.filename)) {
            matched.set(entry.absolutePath, entry);
          }
        });
      });
    };

    formIds.forEach((formId) => addMatches(FORM_MATCHERS[formId as KnownFormId]));
    addMatches(options.domain ? DOMAIN_MATCHERS[options.domain] : undefined);

    return Array.from(matched.values()).sort((a, b) => a.filename.localeCompare(b.filename));
  }

  getNewestFileAgeDays(forceRefresh = false): number | null {
    const snapshot = this.getSnapshot(forceRefresh);
    if (snapshot.entries.length === 0) {
      return null;
    }

    const newest = snapshot.entries.reduce((latest, entry) => {
      if (!latest) return entry;
      return new Date(entry.lastModifiedAt).getTime() > new Date(latest.lastModifiedAt).getTime() ? entry : latest;
    }, null as CourtFormEntry | null);

    if (!newest) {
      return null;
    }

    const ageMs = Date.now() - new Date(newest.lastModifiedAt).getTime();
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  }

  isStale(thresholdDays: number, forceRefresh = false): { stale: boolean; newestFileAgeDays: number | null } {
    const newestFileAgeDays = this.getNewestFileAgeDays(forceRefresh);
    if (newestFileAgeDays === null) {
      return { stale: true, newestFileAgeDays: null };
    }

    return {
      stale: newestFileAgeDays > thresholdDays,
      newestFileAgeDays,
    };
  }

  private scanDirectory(): CourtFormEntry[] {
    if (!fs.existsSync(this.rootPath)) {
      return [];
    }

    return fs
      .readdirSync(this.rootPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const safeName = path.basename(entry.name).replace(/[\\/\x00]/g, '');
        const absolutePath = path.resolve(this.rootPath, safeName);
        const rel = path.relative(this.rootPath, absolutePath);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
          return null;
        }
        const stat = fs.statSync(absolutePath);
        return {
          filename: safeName,
          absolutePath,
          extension: path.extname(safeName).toLowerCase(),
          lastModifiedAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
        };
      })
      .filter((entry): entry is CourtFormEntry => entry !== null);
  }
}