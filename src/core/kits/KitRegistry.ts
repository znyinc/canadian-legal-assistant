import { BaseKit } from './BaseKit';

/**
 * Kit Factory Function - creates kit instances
 */
export type KitFactory = () => BaseKit;

/**
 * Kit Metadata - describes a registered kit
 */
export interface KitMetadata {
  kitId: string;
  kitName: string;
  kitDescription: string;
  domains: string[];
  estimatedDuration: number; // minutes
  complexity: 'simple' | 'moderate' | 'complex';
  tags: string[];
  factory: KitFactory;
  isActive: boolean;
}

/**
 * KitRegistry - Dynamic kit discovery and instantiation
 * 
 * Responsibilities:
 * - Register available kits
 * - Discover kits by ID, domain, or tags
 * - Instantiate kits on demand
 * - Manage kit lifecycle (enable/disable)
 * - Provide kit metadata for UI
 */
export class KitRegistry {
  private kits: Map<string, KitMetadata> = new Map();

  /**
   * Register a kit in the registry
   */
  registerKit(metadata: KitMetadata): void {
    if (this.kits.has(metadata.kitId)) {
      throw new Error(`Kit with ID ${metadata.kitId} already registered`);
    }
    this.kits.set(metadata.kitId, metadata);
  }

  /**
   * Register multiple kits
   */
  registerKits(kitMetadataList: KitMetadata[]): void {
    kitMetadataList.forEach(metadata => this.registerKit(metadata));
  }

  /**
   * Get a kit by ID
   */
  getKit(kitId: string): KitMetadata | undefined {
    return this.kits.get(kitId);
  }

  /**
   * Create a kit instance
   */
  createKit(kitId: string, sessionId?: string, userId?: string): BaseKit | undefined {
    const metadata = this.getKit(kitId);
    if (!metadata) {
      return undefined;
    }
    if (!metadata.isActive) {
      throw new Error(`Kit ${kitId} is not active`);
    }
    
    const kit = metadata.factory();
    return kit;
  }

  /**
   * Find kits by domain
   */
  findKitsByDomain(domain: string): KitMetadata[] {
    return Array.from(this.kits.values()).filter(
      kit => kit.isActive && kit.domains.includes(domain)
    );
  }

  /**
   * Find kits by tag
   */
  findKitsByTag(tag: string): KitMetadata[] {
    return Array.from(this.kits.values()).filter(
      kit => kit.isActive && kit.tags.includes(tag)
    );
  }

  /**
   * Search kits by multiple criteria
   */
  searchKits(criteria: {
    domains?: string[];
    tags?: string[];
    complexity?: 'simple' | 'moderate' | 'complex';
    maxDuration?: number;
  }): KitMetadata[] {
    let results = Array.from(this.kits.values()).filter(kit => kit.isActive);

    if (criteria.domains && criteria.domains.length > 0) {
      results = results.filter(kit =>
        criteria.domains!.some(domain => kit.domains.includes(domain))
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(kit =>
        criteria.tags!.some(tag => kit.tags.includes(tag))
      );
    }

    if (criteria.complexity) {
      results = results.filter(kit => kit.complexity === criteria.complexity);
    }

    if (criteria.maxDuration) {
      results = results.filter(kit => kit.estimatedDuration <= criteria.maxDuration!);
    }

    return results;
  }

  /**
   * Get all active kits
   */
  getAllKits(): KitMetadata[] {
    return Array.from(this.kits.values()).filter(kit => kit.isActive);
  }

  /**
   * Enable or disable a kit
   */
  setKitActive(kitId: string, isActive: boolean): void {
    const metadata = this.getKit(kitId);
    if (!metadata) {
      throw new Error(`Kit ${kitId} not found`);
    }
    metadata.isActive = isActive;
  }

  /**
   * Remove a kit from registry
   */
  unregisterKit(kitId: string): void {
    this.kits.delete(kitId);
  }

  /**
   * Get kit count
   */
  getKitCount(): number {
    return this.kits.size;
  }

  /**
   * Get active kit count
   */
  getActiveKitCount(): number {
    return Array.from(this.kits.values()).filter(kit => kit.isActive).length;
  }

  /**
   * Get domains covered by active kits
   */
  getCoveredDomains(): string[] {
    const domains = new Set<string>();
    this.getAllKits().forEach(kit => {
      kit.domains.forEach(domain => domains.add(domain));
    });
    return Array.from(domains).sort();
  }

  /**
   * Get summary for UI
   */
  getSummary() {
    const allKits = Array.from(this.kits.values());
    const activeKits = this.getAllKits();
    
    return {
      totalKits: allKits.length,
      activeKits: activeKits.length,
      inactiveKits: allKits.length - activeKits.length,
      kits: activeKits.map(kit => ({
        kitId: kit.kitId,
        kitName: kit.kitName,
        kitDescription: kit.kitDescription,
        estimatedDuration: kit.estimatedDuration,
        complexity: kit.complexity,
      })),
    };
  }
}

/**
 * Global registry instance (singleton pattern)
 */
let globalRegistry: KitRegistry | null = null;

/**
 * Get or create global kit registry
 */
export function getGlobalKitRegistry(): KitRegistry {
  if (!globalRegistry) {
    globalRegistry = new KitRegistry();
  }
  return globalRegistry;
}

/**
 * Reset global registry (mainly for testing)
 */
export function resetGlobalKitRegistry(): void {
  globalRegistry = null;
}
