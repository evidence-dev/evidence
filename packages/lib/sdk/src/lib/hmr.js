/// <reference types="vite/client" />

import chalk from 'chalk';

/** @param {unknown} directory 
 *  @returns {('sources' | 'queries')[]} */
const validateHmrDirectory = (directory) => {
	const validValues = ['sources', 'queries'];

	if (typeof directory === 'string') 
		directory = [directory];
	
	if (Array.isArray(directory)) {
		const uniqueDirectories = [...new Set(directory).values()];
		if (uniqueDirectories.every(v => typeof v === 'string' 
				&& validValues.includes(v))) return uniqueDirectories;
	} 
	
	throw new Error('HMR can only be disabled/enabled for "sources", "queries"');
};

/** @param {('sources' | 'queries') | ('sources' | 'queries')[]} directory  */
export const disableHmr = (directory) => {
	if (typeof process === 'undefined') {
		throw new Error('HMR can only be disabled on the server side');
	}

	directory = validateHmrDirectory(directory);
	console.info(chalk.bold.yellow(
		`Evidence will not re-build the sources or hydrate the application automatically ` +
		`when files within the ${directory.join('/')} folder(s) are changed.`
	));
	directory.forEach(v => {
		process.env[`EVIDENCE_DISABLE_${v.toUpperCase()}_HMR`] = 'true';
	});
}

/** @param {('sources' | 'queries') | ('sources' | 'queries')[]} directory  */
export const enableHmr = (directory) => {
	if (typeof process === 'undefined') {
		throw new Error('HMR can only be enabled on the server side');
	}

	directory = validateHmrDirectory(directory);
	directory.forEach(v => {
		delete process.env[`EVIDENCE_DISABLE_${v.toUpperCase()}_HMR`];
	});
}

/** @param {('sources' | 'queries') | ('sources' | 'queries')[]} directory
  * @returns {boolean | undefined} */
export const isHmrEnabled = (directory) => {
	directory = validateHmrDirectory(directory);
	/** @param {string} v */
	const envName = (v) => `EVIDENCE_DISABLE_${v.toUpperCase()}_HMR`;

	if (typeof process !== 'undefined')
		return directory.every(v => 
			process.env[envName(v)] !== 'true');
	if (typeof import.meta.env !== 'undefined')
		return directory.every(v => 
			import.meta.env[envName(v)] !== 'true');
}