import { dev } from '$app/environment';

export const load = async () => {
	if (dev) {
		const { getDatasourceOptions } = await import('@evidence-dev/plugin-connector');
		const datasourceSettings = await getDatasourceOptions();

		return {
			datasourceSettings
		};
	}
	return {};
};
