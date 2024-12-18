import { log } from '../logger/index.js';
import { EvidenceError } from './EvidenceError.js';

export const enableStrictMode = () => {
	if (typeof process === 'undefined') {
		throw new Error('Strict mode must be enabled server-side');
	}
	log.info('Enabling strict mode');
	process.env.EVIDENCE_STRICT_MODE = 'true';
};

export const isStrictMode = () => {
	if (typeof process !== 'undefined') return Boolean(process.env.EVIDENCE_STRICT_MODE);
	if (typeof import.meta.env !== 'undefined') return Boolean(import.meta.env.EVIDENCE_STRICT_MODE);
	throw new EvidenceError('Unable to identify if strict mode is enabled', [
		'process is undefined',
		'import.meta.env is undefined'
	]);
};
