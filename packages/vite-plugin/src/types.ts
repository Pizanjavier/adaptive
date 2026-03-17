export interface BudgetConfig {
  maxLowTierBundle?: number;
  maxHighVariant?: number;
  minSavingsPercent?: number;
  enforce?: 'error' | 'warn';
}

export interface AdaptivePluginConfig {
  analysisSizeThreshold?: number;
  report?: boolean;
  reportFormat?: 'console' | 'html' | 'json';
  reportDir?: string;
  preloadHints?: boolean;
  ssrDefaultTier?: 'high' | 'low';
  targetTier?: 'high' | 'low';
  sizeOverrides?: Record<string, number>;
  budget?: BudgetConfig;
}

export interface ResolvedConfig {
  analysisSizeThreshold: number;
  report: boolean;
  reportFormat: 'console' | 'html' | 'json';
  reportDir: string;
  preloadHints: boolean;
  ssrDefaultTier: 'high' | 'low';
  targetTier?: 'high' | 'low';
  sizeOverrides: Record<string, number>;
  budget?: BudgetConfig;
}

export interface AdaptiveBoundary {
  name: string;
  filePath: string;
  line: number;
  highImport?: string;
  lowImport?: string;
  mediumImport?: string;
  componentImport?: string;
  lowFallbackImport?: string;
}

export interface DependencyInfo {
  id: string;
  size: number;
}

export interface BoundaryAnalysis {
  boundary: AdaptiveBoundary;
  highSize: number;
  lowSize: number;
  mediumSize: number;
  exclusiveHighDeps: DependencyInfo[];
  exclusiveLowDeps: DependencyInfo[];
  sharedDeps: DependencyInfo[];
  savings: number;
  savingsPercent: number;
}

export interface ModuleInfo {
  id: string;
  code: string | null;
  importedIds: string[];
}

export interface ModuleGraph {
  getModuleInfo(id: string): ModuleInfo | null;
  getModuleIds(): IterableIterator<string>;
}
