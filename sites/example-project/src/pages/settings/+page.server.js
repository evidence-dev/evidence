import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	if (dev) {
		const { getDatasourceOptions, getDatasourcePlugins } = await import(
			'@evidence-dev/plugin-connector'
		);
		const datasourceSettings = await getDatasourceOptions();

		const datasourcePlugins = await getDatasourcePlugins();

		const serializedPlugins = Object.fromEntries(
			Object.entries(datasourcePlugins).map(([k, v]) => [
				k,
				{
					...v,
					factory: undefined,
					testConnection: undefined
				}
			])
		);

		return {
			datasourceSettings: datasourceSettings.map((sp) => ({ ...sp, queries: [] })), // stripping out queries prevents large files (e.g. duckdb databases) from being sent to the frontend.
			plugins: serializedPlugins
		};
	}
	return {};
};

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	updateSource: async (e) => {
		const formData = Object.fromEntries(await e.request.formData().then((r) => r.entries()));
		const source = formData.source ? JSON.parse(formData.source) : null;

		if (!source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const { updateDatasourceOptions, getDatasourcePlugins, DatasourceSpecFileSchema } =
			await import('@evidence-dev/plugin-connector');

		// TODO: Should this actually be handled inside the plugin connector (probably)
		// TODO: Handle deletion and move of connectors (right now it is only create / modify in place)

		const r = DatasourceSpecFileSchema.safeParse(source);

		if (!r.success) {
			return fail(400, r.error.format());
		}

		const datasourcePlugins = await getDatasourcePlugins();

		try {
			return {
				updatedSource: await updateDatasourceOptions(source, datasourcePlugins).then((r) => ({
					...r,
					queries: []
				})) // stripping out queries prevents large files (e.g. duckdb databases) from being sent to the frontend.
			};
		} catch (e) {
			return fail(500, e.message);
		}
	},
	testSource: async (e) => {
		const formData = Object.fromEntries(await e.request.formData().then((r) => r.entries()));
		const source = formData.source ? JSON.parse(formData.source) : null;

		if (!source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const { getDatasourcePlugins, DatasourceSpecFileSchema, DatasourceSpecSchema } = await import(
			'@evidence-dev/plugin-connector'
		);

		const specFile = DatasourceSpecFileSchema.safeParse(source);

		if (!specFile.success) {
			return fail(400, specFile.error.format());
		}

		const fullSpec = DatasourceSpecSchema.safeParse({
			queries: [], // We aren't really worried about queries here
			...source
		});

		if (!fullSpec.success) {
			return fail(400, fullSpec.error.format());
		}

		const datasourcePlugins = await getDatasourcePlugins();

		const plugin = datasourcePlugins[specFile.data.type];

		if (!plugin) {
			return fail(400, { message: `Plugin for database ${specFile.data.type} not found.` });
		}

		const valid = await plugin.testConnection(fullSpec.data.options, fullSpec.data.sourceDirectory);
		if (valid !== true) {
			return fail(200, { reason: valid.reason });
		}
		return {
			success: true
		};
	}
};
