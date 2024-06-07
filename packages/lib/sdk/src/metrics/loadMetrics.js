import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';
import { metricsDirectory } from '../build-dev/vite/virtuals/node/projectPaths.js';
import { MetricFileSchema } from './schemas/metrics.schema.js';
import { cleanZodErrors } from '../lib/cleanZodErrors.js';

/**
 * @returns {Promise<import('./types.js').MetricSpec[]>}
 */
export const loadMetrics = async () => {
	const exists = await fs
		.stat(metricsDirectory)
		.then(() => true)
		.catch(() => false);
	if (!exists) await fs.mkdir(metricsDirectory, { recursive: true });

	const metricFiles = await fs.readdir(metricsDirectory);

	const metrics = [];

	for (const metricFile of metricFiles) {
		console.log(`Loading ${metricFile}`);

		const content = await fs.readFile(path.join(metricsDirectory, metricFile), 'utf8');
		const metricRaw = yaml.parse(content);
		const metric = MetricFileSchema.safeParse(metricRaw);

		if (!metric.success) {
			// TODO: Make error handling not suck
			console.error(yaml.stringify(cleanZodErrors(metric.error.format())));
			process.exit(1);
		} else {
			metrics.push(...metric.data.metrics.map((v) => ({ ...v, source: metric.data.source })));
		}
	}
	return metrics;
};
