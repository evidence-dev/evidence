/**
 * @param {import("zod").ZodError} e
 * @returns {Record<string, string>}
 */
export const unnestZodError = (e) => {
	/** @type {Record<string, string>} */
	const out = {};
	for (const issue of e.issues) {
		const path = issue.path.join('.');
		if (out[path]) continue;
		out[path] = issue.message;
	}
	return out;
};
