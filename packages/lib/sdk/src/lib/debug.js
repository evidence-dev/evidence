export const enableDebug = () => (process.env.EVIDENCE_DEBUG = 'true');
export const isDebug = () => {
	return true;
	if (typeof process !== 'undefined')
		return Boolean(process.env.EVIDENCE_DEBUG || process.env.NODE_ENV === 'test');
	// @ts-expect-error
	if (typeof import.meta.env !== 'undefined') return Boolean(import.meta.env.EVIDENCE_DEBUG);
};
export const disableDebug = () => {
	delete process.env.EVIDENCE_DEBUG;
};
