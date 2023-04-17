import { dev } from '$app/environment';
import { base } from '$app/paths';
export const load = async ({ fetch }) => {
	if (dev) {
		const settingsRes = await fetch(`${base}/api/settings.json`);
		const customFormattingSettingsRes = await fetch(`${base}/api/customFormattingSettings.json`);
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
