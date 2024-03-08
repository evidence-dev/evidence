import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		coverage: {
			// you can include other reporters, but 'json-summary' is required, json is recommended
			reporter: ['json-summary', 'json', 'cobertura'],
			// If you want a coverage reports even if your tests are failing, include the reportOnFailure option
			reportOnFailure: true
		}
	}
});
