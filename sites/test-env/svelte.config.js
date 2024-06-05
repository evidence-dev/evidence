import { loadMetrics, processMetric } from '@evidence-dev/sdk/metrics';
/** @type {import("@sveltejs/kit").Config} */
export default {
	preprocess: [
		(() => {
			/** @type {ReturnType<processMetric>[]} */
			let metricSpecs;

			/** @type {string} */
			let metricDefString;

			/** @type {import("svelte/compiler").PreprocessorGroup} */
			return {
				script: async ({ content, filename, attributes }) => {
					if (!filename.endsWith('.md')) return;
					if (attributes.context === 'module') return;
					if (!metricSpecs) {
						const metrics = await loadMetrics();
						metricSpecs = await Promise.all(metrics.map(processMetric));

						metricDefString = `
						import {MetricsInputKey, MetricsContextKey} from '@evidence-dev/sdk/metrics/browser';
						import {Unset} from '@evidence-dev/sdk/usql';
						${metricSpecs
							.map((spec) => {
								return `
								// This code lifted from process-queries
								// SSR has been ripped out for the moment

								/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
								let ${spec.name};
								
								$: __${spec.name}Text = \`${spec.query}\`;
								$: __${spec.name}Factory(__${spec.name}Text)
								
								const __${spec.name}Factory = Query.createReactive(
									{ callback: $v => ${spec.name} = $v, execFn: queryFunc },
									{ id: 'Metric-${spec.name}' }
								)
								__${spec.name}Factory(__${spec.name}Text)
								globalThis[Symbol.for("Metric-${spec.name}")] = { get value() { return ${spec.name} } }
								`;
							})
							.join('\n')}


							setContext(MetricsContextKey, ${JSON.stringify(
								Object.fromEntries(
									metrics.map((spec) => [
										spec.name,
										{ dimensions: spec.dimensions, timeGrains: spec.time_grains }
									])
								)
							)})
						`;
					}
					content += '\n' + metricDefString;

					return { code: content };
				}
			};
		})()
	],
	compilerOptions: {
		dev: true
	},
	kit: {},
	vite: {
		server: {
			watch: {
				usePolling: true
			}
		}
	}
};
