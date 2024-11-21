import { z } from 'zod';

/** @typedef {z.infer<typeof DatasourceSpecFileSchema>} DatasourceSpec */

export const DatasourceSpecFileSchema = z
	.object({
		type: z.string(),
		name: z.string().refine((s) => s?.toString().match(/^[a-zA-Z0-9_-]+$/)?.length),
		options: z.any(),
		buildOptions: z
			.object({
				batchSize: z
					.number()
					.min(1)
					.optional()
					.default(1000 * 1000)
			})
			.optional()
			.default({})
	})
	.transform((datasource) => ({
		...datasource,
		environmentVariables: getDatasourceEnvironmentVariables(datasource.name)
	}));

const keyRegex = /^EVIDENCE_SOURCE__([a-zA-Z0-9_]+)$/;

/** @param {string} sourceName */
const getDatasourceEnvironmentVariables = (sourceName) => {
	/** @type {Record<string, any>} */
	const environmentVariables = {};

	for (const [key, value] of Object.entries(process.env)) {
		const parts = keyRegex.exec(key);
		if (!parts) continue;
		if (parts?.length < 2) continue;
		if (!parts[1].toLowerCase().startsWith(sourceName.toLowerCase())) continue;
		const rawOptKey = parts[1].substring(sourceName.length + 2).split('__');

		let temp = environmentVariables;
		rawOptKey.forEach((key, i) => {
			if (i < rawOptKey.length - 1) {
				// We haven't reached the final key
				if (!temp[key]) temp[key] = {};
				temp = temp[key];
			} else {
				temp[key] = value;
			}
		});
	}
	return environmentVariables;
};
