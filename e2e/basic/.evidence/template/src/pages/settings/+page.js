import { dev } from '$app/environment';

export const load = async ({ fetch, data }) => {
	if (dev) {
		const settingsRes = await fetch('../api/settings.json');
		const customFormattingSettingsRes = await fetch('../api/customFormattingSettings.json');
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
