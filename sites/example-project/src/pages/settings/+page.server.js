import { dev } from '$app/environment';

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
					factory: undefined
				}
			])
		);

		return {
			datasourceSettings,
			plugins: serializedPlugins
		};
	}
	return {};
};
