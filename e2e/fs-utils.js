import fs from 'node:fs';

/** @type {Map<string, string>} */
const originalFiles = new Map();

export const restoreChangedFiles = () => {
	originalFiles.forEach((content, file) => {
		fs.writeFileSync(file, content, 'utf-8');
	});
	originalFiles.clear();
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
