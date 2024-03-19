/**
 * @param {string} importName
 * @param {string} sourcePackage
 * @param {string} content
 * @returns
 */
export const checkImport = (importName, sourcePackage, content) => {
	const regex = new RegExp(
		`import {?.*${importName}.*}? from ["']${sourcePackage.replaceAll('$', '\\$')}["']`
	);
	return regex.test(content);
};
