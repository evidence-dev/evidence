/// <reference types="vite/client" />
export const enableDebug = () => {
	process.env.EVIDENCE_DEBUG = 'true';
	process.env.VITE_PUBLIC_EVIDENCE_DEBUG = 'true';
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
