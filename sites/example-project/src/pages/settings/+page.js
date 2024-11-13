import { dev } from '$app/environment';
import { addBasePath } from '@evidence-dev/sdk/utils/svelte';

export const load = async ({ fetch, data }) => {
	if (dev) {
		const settingsRes = await fetch(addBasePath('/api/settings.json'));
		const customFormattingSettingsRes = await fetch(
			addBasePath('/api/customFormattingSettings.json')
		);
		const { settings, gitIgnore } = await settingsRes.json();
		const { customFormattingSettings } = await customFormattingSettingsRes.json();
		return {
			...data,
			settings,
			gitIgnore,
			customFormattingSettings
		};
	} else {
		return {
			...data,
			settings: {},
			gitIgnore: ''
		};
	}
};
