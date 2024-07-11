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
	// This regex is prefixed with a negative lookbehind to disqualify $${var} patterns
	const regex = RegExp(/(?<!\$)\$\{(.+?)\}/, 'g');

	let match;
	while ((match = regex.exec(output)) !== null) {
		const fullMatch = match[0]; // e.g. ${variable}
		const varName = match[1]; // e.g. variable
		const start = match.index;
		const end = match[0].length + start;

		if (varName in validVars && validVars[varName]) {
			const value = validVars[varName];
			if (!value) throw new Error('Value somehow became undefined');
			const before = output.substring(0, start);
			const after = output.substring(end);
			output = `${before}${value}${after}`;
			// Update the lastIndex of the regular expression to continue the search from the end of the replacement
			regex.lastIndex = start + value.length;
		} else
			console.warn(
				`Missed substition for ${fullMatch}, do you need to set EVIDENCE_VAR__${varName}?`
			);
	}

	output = output.replaceAll('$${', '${');

	return output;
};
