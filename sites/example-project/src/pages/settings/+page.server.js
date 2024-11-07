import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import { logQueryEvent } from '@evidence-dev/telemetry';
import { loadSources } from '@evidence-dev/sdk/plugins';

export const load = async () => {
	if (dev) {
		const { getDatasourcePlugins } = await import('@evidence-dev/plugin-connector');
		const sources = await loadSources();

		const datasourcePlugins = await getDatasourcePlugins();

		const serializedPlugins = Object.fromEntries(
			Object.entries(datasourcePlugins).map(([k, v]) => [
				k,
				{
					...v,
					factory: undefined,
					testConnection: undefined,
					processSource: undefined
				}
			])
		);

		return {
			sources,
			plugins: serializedPlugins
		};
	}
	return {};
};

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	updateSource: async (e) => {
		const formData = Object.fromEntries(await e.request.formData());
		const source = formData.source ? JSON.parse(formData.source) : null;

		if (!source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const { updateDatasourceOptions, getDatasourcePlugins, DatasourceSpecFileSchema } =
			await import('@evidence-dev/plugin-connector');

		// TODO: Should this actually be handled inside the plugin connector (probably)
		// TODO: Should renaming a connector move it?

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
		const formData = Object.fromEntries(await e.request.formData());
		if (!formData?.source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const source = JSON.parse(formData.source);

		const {
			getDatasourcePlugins,
			updateDatasourceOptions,
			DatasourceSpecFileSchema,
			DatasourceSpecSchema,
			cleanZodErrors
		} = await import('@evidence-dev/plugin-connector');

		const specFile = DatasourceSpecFileSchema.safeParse(source);

		if (!specFile.success) {
			return fail(400, specFile.error.format());
		}

		const fullSpec = DatasourceSpecSchema.safeParse({
			queries: [], // We aren't really worried about queries here
			...source
		});

		const datasourcePlugins = await getDatasourcePlugins();

		/** @type {import("@evidence-dev/plugin-connector").DatasourceSpec} */
		let specData;
		if (!fullSpec.success) {
			const formatted = fullSpec.error.format();
			if (formatted.sourceDirectory?._errors[0] === 'Required') {
				console.log(`Created ${specFile.data.name} automatically while testing the connection`);
				// This connector has not been saved yet.
				specData = await updateDatasourceOptions(source, datasourcePlugins);
			} else {
				console.log(cleanZodErrors(formatted));
				return fail(400, { message: 'Connection did not match required format' });
			}
		} else {
			specData = fullSpec.data;
		}

		const databaseType = specData.type;
		const sourceName = specData.name;

		const plugin = datasourcePlugins[databaseType];

		const valid = await plugin.testConnection(specData.options, specData.sourceDirectory);
		if (!plugin) {
			logQueryEvent('db-plugin-unvailable', databaseType, undefined, undefined, dev);
			return fail(400, { message: `Plugin for datasource "${databaseType}" not found.` });
		}

		plugin.name = specData.name;

		if (valid !== true) {
			logQueryEvent('db-connection-error', databaseType, sourceName, undefined, dev);
			return fail(200, { message: valid.reason });
		} else {
			logQueryEvent('db-connection-success', databaseType, sourceName, undefined, dev);

			return {
				success: true
			};
		}
	}
};
