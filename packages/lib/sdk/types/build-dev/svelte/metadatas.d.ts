export function getFileMetadata(filename: string): FileMetadata | undefined;
export function addFileMetadata(filename: string, metadata: FileMetadata): void;
export function setFileMetadata(filename: string, metadata: FileMetadata): void;
export function clearFileMetadatas(): void;
export function getAllFileMetadatas(): {
    [k: string]: import("../../types/index.js").FileMetadata;
};
export type FileMetadata = import("../../types/index.js").FileMetadata;
//# sourceMappingURL=metadatas.d.ts.map