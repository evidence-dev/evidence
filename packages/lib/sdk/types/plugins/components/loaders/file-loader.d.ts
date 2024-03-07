/**
 * @param {string} rootDir
 *
 * @returns {Promise<string[]>}
 */
export function fileLoader(rootDir: string): Promise<string[]>;
export function findSvelteComponents(root: string): Promise<string[]>;
export function isLibraryComponent(fileContent: string): Promise<boolean>;
//# sourceMappingURL=file-loader.d.ts.map