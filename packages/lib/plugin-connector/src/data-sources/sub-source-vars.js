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
	while ((match = regex.exec(queryString)) !== null) {
		const fullMatch = match[0]; // e.g. ${variable}
		const varName = match[1]; // e.g. variable
		if (varName in validVars && validVars[varName]) {
			const value = validVars[varName];
			if (value !== undefined) {
				let newOutput = output.replace(fullMatch, value);
				output = newOutput;
			} else {
				console.warn(`Missed substitution for ${fullMatch}, do you need to set EVIDENCE_VAR__${varName}?`);
			}
		}
	}
	return output;
};

process.env.EVIDENCE_VAR__var_a = 'abc';
process.env.EVIDENCE_VAR__var_b = 'def';
process.env.EVIDENCE_VAR__var_c = 'ghi';

console.log(subSourceVariables('|${var_a}|${var_b}|${var_c}|'));
console.log(subSourceVariables('|${var_a}|${var_z}|${var_c}|'));
console.log(subSourceVariables('|${var_a}|'));
console.log(subSourceVariables('|${var_b}|'));
console.log(subSourceVariables('|${var_c}|'));
console.log(subSourceVariables('|${var_z}|'));
