export const enableDebug = () => (process.env.EVIDENCE_DEBUG = 'true');
export const isDebug = () => {
	if (typeof process !== 'undefined')
		return Boolean(process.env.EVIDENCE_DEBUG || (process.env.NODE_ENV === 'test' && !process.env.EVIDENCE_DISABLE_TEST_DEBUG));
	// @ts-expect-error
	if (typeof import.meta.env !== 'undefined') return Boolean(import.meta.env.EVIDENCE_DEBUG);
};
export const disableDebug = () => {
	delete process.env.EVIDENCE_DEBUG;
};
