/** @typedef {import("../../types/index.js").FileMetadata} FileMetadata */

/** @type {Map<string, FileMetadata>} */
const metadatas = new Map();

/**
 * @param {string} filename
 * @returns {FileMetadata | undefined}
 */
export const getFileMetadata = (filename) => metadatas.get(filename);

/**
 * @param {string} filename
 * @param {FileMetadata} metadata
 * @returns {void}
 */
export const addFileMetadata = (filename, metadata) => {
	metadatas.set(filename, Object.assign(metadatas.get(filename) ?? {}, metadata));
};

/**
 * @param {string} filename
 * @param {FileMetadata} metadata
 * @returns {void}
 */
export const setFileMetadata = (filename, metadata) => {
	metadatas.set(filename, metadata);
};

/**
 * @returns {void}
 */
export const clearFileMetadatas = () => {
	if (process.env.NODE_ENV !== 'test')
		console.warn('clearFileMetadatas is only intended to be used during testing');
	metadatas.clear();
};

export const getAllFileMetadatas = () => Object.fromEntries(metadatas.entries());
