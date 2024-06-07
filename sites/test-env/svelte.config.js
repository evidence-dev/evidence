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

						metricDefString = `
						import {Metric, MetricsInputKey, MetricsContextKey} from '@evidence-dev/sdk/metrics/browser';
						import {Unset} from '@evidence-dev/sdk/usql';
						
						${metrics
							.map((spec) => {
								return `
								// This code lifted from process-queries
								// SSR has been ripped out for the moment

								/** @type {import("@evidence-dev/sdk/usql").QueryValue} */
								let ${spec.name};
								
								$: __${spec.name}Cut = {
									dimensions: !inputs[MetricsInputKey].${spec.name}.dimensions[Unset] ? inputs[MetricsInputKey].${spec.name}.dimensions?.rawValues?.map(v => v.value) ?? [] : undefined,
									time_grain: !inputs[MetricsInputKey].${spec.name}.time_grain[Unset] && inputs[MetricsInputKey].${spec.name}.time_grain ? inputs[MetricsInputKey].${spec.name}.time_grain.value : undefined
								}
								$: __${spec.name}Factory(__${spec.name}Cut)
								
								const __${spec.name}Factory = Metric.createMetric(
									${JSON.stringify(spec)},
									{ callback: $v => ${spec.name} = $v, execFn: queryFunc },
									{ id: 'Metric-${spec.name}' }
								)
								__${spec.name}Factory({})
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
