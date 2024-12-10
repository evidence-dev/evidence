import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import { logQueryEvent } from '@evidence-dev/telemetry';
import {
	loadSources,
	loadSourcePlugins,
	DatasourceSpecFileSchema,
	Options,
	writeSourceConfig,
	getDatasourceConfigAsEnvironmentVariables
} from '@evidence-dev/sdk/plugins';

export const load = async () => {
	if (dev) {
		const sources = await loadSources();
		const datasources = await loadSourcePlugins();

		const plugins = Object.entries(datasources.bySource).reduce((acc, [name, v]) => {
			acc[name] = {
				package: { package: v[0] },
				options: v[1].options
			};
			return acc;
		}, {});

		return {
			sources: sources.map((source) => ({
				...source,
				environmentVariables: getDatasourceConfigAsEnvironmentVariables(source)
			})),
			plugins
		};
	}
	return {};
};

/** @type {import("@sveltejs/kit").Actions} */
export const actions = {
	updateSource: async (e) => {
		// editSourceConfig, refactor to use logic without prompts
		const formData = Object.fromEntries(await e.request.formData());
		const source = formData.source ? JSON.parse(formData.source) : null;

		if (!source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const r = DatasourceSpecFileSchema.safeParse(source);

		if (!r.success) {
			return fail(400, r.error.format());
		}

		const datasourcePlugins = await loadSourcePlugins();
		const [, pluginSpec] = datasourcePlugins.getBySource(r.data.type);
		const opts = Options(pluginSpec.options, r.data.options);
		// Possible holdovers from the loading process
		delete source.environmentVariables;
		delete source.initialName;

		try {
			return {
				updatedSource: await writeSourceConfig(opts, source)
			};
		} catch (e) {
			return fail(500, e.message);
		}
	},
	testSource: async (e) => {
		// loadSourcePlugins().getByPackageName('')[1].testConnection
		const formData = Object.fromEntries(await e.request.formData());
		if (!formData?.source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const source = formData.source ? JSON.parse(formData.source) : null;

		if (!source) {
			return fail(400, { message: "Missing required field 'source'" });
		}

		const r = DatasourceSpecFileSchema.safeParse(source);

		if (!r.success) {
			return fail(400, r.error.format());
		}
		const datasourcePlugins = await loadSourcePlugins();
		const [pack, pluginSpec] = datasourcePlugins.getBySource(r.data.type);

		console.log(r, pack, pluginSpec, datasourcePlugins);

		if (!pluginSpec) {
			logQueryEvent('db-plugin-unvailable', r.data.type, undefined, undefined, dev);
			return fail(400, { message: `Plugin for datasource "${r.data.type}" not found.` });
		}
		const valid = await pluginSpec.testConnection(r.data.options, source.dir);

		if (valid !== true) {
			logQueryEvent('db-connection-error', r.data.type, r.data.name, undefined, dev);
			return fail(200, { message: valid.reason });
		} else {
			logQueryEvent('db-connection-success', r.data.type, r.data.name, undefined, dev);

			return {
				success: true
			};
		}
	}
};
