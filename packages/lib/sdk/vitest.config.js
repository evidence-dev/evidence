/** @type {import("vitest").UserConfig} */
export default {
	plugins: [
		{
			load: (id) => (id === '\0$evidence/config' ? `export const config = {}` : null),
			resolveId: (id) => (id === '$evidence/config' ? '\0$evidence/config' : null)
		}
	],
	coverage: {
		// you can include other reporters, but 'json-summary' is required, json is recommended
		reporter: ['json-summary', 'json', 'cobertura'],
		// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
		reportOnFailure: true
	}
};
