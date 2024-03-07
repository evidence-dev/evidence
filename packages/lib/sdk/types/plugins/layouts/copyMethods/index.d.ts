/**
 * @type {Record<string, { copyAll: (rootDir: string, rootTargetDir: string) => Promise<void>, copyFile: (rootDir: string, rootTargetDir: string, file: import("fs").Dirent) => void }>}
 */
export const copyMethods: Record<string, {
    copyAll: (rootDir: string, rootTargetDir: string) => Promise<void>;
    copyFile: (rootDir: string, rootTargetDir: string, file: import("fs").Dirent) => void;
}>;
//# sourceMappingURL=index.d.ts.map