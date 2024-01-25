/**
 * Replaces all ${var} patterns in a string with the matching EVIDENCE_VAR__[var] environment variables
 * @param {string} queryString
 * @returns {string}
 */
export const subSourceVariables = (queryString) => {
	const envPrefix = 'EVIDENCE_VAR__';

	if (queryString.length > 1024 * 1024) {
		if (process.env.VITE_EVIDENCE_DEBUG) {
			console.log(
				`Skipping variable interpolation for file; has more than ${1024 * 1024} characters`
			);
		}
		return queryString;
	}

	const validVars = Object.fromEntries(
		Object.entries(process.env)
			.filter(([k]) => k.startsWith(envPrefix))
			.map(([k, v]) => {
				const name = k.substring(envPrefix.length);
				const value = v?.toString();
				return [name, value];
			})
	);
	let output = queryString;
	const regex = RegExp(/\$\{(.+?)\}/, 'g');
	let match;
	while ((match = regex.exec(queryString)) !== null) {
		if (match[1] in validVars) output = output.replace(match[0], validVars[match[1]]);
		else
			console.warn(
				`Missed substition for ${match[0]}, do you need to set EVIDENCE_VAR__${match[1]}?`
			);
	}

	return queryString;
};
