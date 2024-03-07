export function loadCache(metaDir: string): Promise<void>;
export function flushCache(metaDir: string): Promise<void>;
export function hash(str: string): string;
export function addToCache(sourceName: string, queryName: string, content: string): void;
export function checkCache(sourceName: string, queryName: string, content: string): boolean;
//# sourceMappingURL=SourceResultCache.d.ts.map