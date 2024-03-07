import { z } from 'zod';
import { PluginPackageSchema, isDatasourcePlugin } from '../schemas/plugin-package.schema.js';

const REGISTRY_URL = 'https://registry.npmjs.com';

// These schemas are NOT complete; they only have fields that we care about
const responseShape = z.object({
	objects: z.array(
		z.object({
			package: z.object({
				name: z.string(),
				description: z.string().optional(),
				version: z.string()
			})
		})
	)
});

/**
 * @returns {Promise<import("./Datasources.js").DatasourcePackage[]>}
 */
export const getPublishedDatasources = async () => {
	const searchUrl = REGISTRY_URL + '/-/v1/search?text=keywords:evidence-datasource';
	const response = await fetch(searchUrl).then((r) => r.json());

	const result = responseShape.parse(response);

	const output = await Promise.all(
		result.objects.map(async ({ package: pack }) => {
			const metaUrl = REGISTRY_URL + `/${pack.name}`;
			const metaResponse = await fetch(metaUrl).then((r) => r.json());
			if (!('versions' in metaResponse) || typeof metaResponse.versions !== 'object') {
				console.debug(`Malformed response for potential plugin ${pack.name} (missing versions)`);
				return null;
			}
			if (!(pack.version in metaResponse.versions)) {
				console.debug(
					`Malformed response for potential plugin ${pack.name} (missing version ${pack.version})`
				);
				return null;
			}
			const meta = PluginPackageSchema.parse(metaResponse.versions[pack.version]);

			if (!isDatasourcePlugin(meta)) {
				console.debug(
					`${pack.name} has evidence-datasource keyword, but is not a valid datasource`
				);
				return null;
			}

			return meta;
		})
	);

	return output.filter(
		/**
		 * Type narrowing to assert that the values are not null
		 * @returns {o is import("./Datasources.js").DatasourcePackage}
		 */
		(o) => o !== null
	);
};
