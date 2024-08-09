import fs from 'node:fs';
import path from 'node:path';

/** @type {Map<string, string>} */
const originalFiles = new Map();

/** @type {Set<string>} */
const createdFiles = new Set();

/** @type {Map<string, string>} */
const deletedFiles = new Map();

export const restoreChangedFiles = () => {
	originalFiles.forEach((content, file) => {
		fs.writeFileSync(file, content, 'utf-8');
	});
	originalFiles.clear();

	createdFiles.forEach((file) => {
		fs.unlinkSync(file);
	});
	createdFiles.clear();

	deletedFiles.forEach((content, file) => {
		fs.writeFileSync(file, content, 'utf-8');
	});
	deletedFiles.clear();
};

/**
 * @param {string} filePath
 * @param {(content: string) => string} replacer
 */
export const editFile = (filePath, replacer) => {
	const content = fs.readFileSync(filePath, 'utf-8');
	if (!originalFiles.has(filePath)) {
		originalFiles.set(filePath, content);
	}
	const newContent = replacer(content);
	fs.writeFileSync(filePath, newContent);
};

export const createFile = (filePath, content) => {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, content);
	createdFiles.add(filePath);
};

export const deleteFile = (filePath) => {
	const content = fs.readFileSync(filePath, 'utf-8');
	deletedFiles.set(filePath, content);
	fs.unlinkSync(filePath);
};
