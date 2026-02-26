/// <reference types="vite/client" />

import chalk from 'chalk';

/** @type {Set<() => unknown>} */
const enableFns = new Set();
/** @param {() => unknown} fn */
export const onEnableDebug = (fn) => {
	if (isDebug()) fn();
	else enableFns.add(fn);
};

export const enableDebug = () => {
	if (typeof process === 'undefined') {
		throw new Error('Debug must be enabled server-side');
	}
	console.debug(chalk.bold.yellow('Evidence running with debug logging'));
	process.env.EVIDENCE_DEBUG = 'true';
	process.env.VITE_EVIDENCE_DEBUG = 'true';
	process.env.VITE_PUBLIC_EVIDENCE_DEBUG = 'true';

	enableFns.forEach((fn) => fn());
};

export const isDebug = () => {
	if (typeof process !== 'undefined')
		return Boolean(
			process.env.EVIDENCE_DEBUG ||
			process.env.VITE_PUBLIC_EVIDENCE_DEBUG ||
			(process.env.NODE_ENV === 'test' && !process.env.EVIDENCE_DISABLE_TEST_DEBUG)
		);
	if (typeof import.meta.env !== 'undefined')
		return (
			Boolean(import.meta.env.EVIDENCE_DEBUG) || Boolean(import.meta.env.VITE_PUBLIC_EVIDENCE_DEBUG)
		);
};
export const disableDebug = () => {
	delete process.env.EVIDENCE_DEBUG;
	delete process.env.VITE_PUBLIC_EVIDENCE_DEBUG;
};
