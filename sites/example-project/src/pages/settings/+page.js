import { dev } from '$app/environment';
export const load = async ({ fetch }) => {
	if (dev) {
		const settingsRes = await fetch('../api/settings.json');
		const customFormattingSettingsRes = await fetch('../api/customFormattingSettings.json');
		const { settings, gitIgnore } = await settingsRes.json();
		const { customFormattingSettings } = await customFormattingSettingsRes.json();
		return {
			settings,
			gitIgnore,
			customFormattingSettings
		};
	} else {
		return {
			settings: {},
			gitIgnore: ''
		};
	}
};
