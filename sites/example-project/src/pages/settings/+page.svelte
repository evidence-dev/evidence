<script>
	export let data;
	let { settings, customFormattingSettings, gitIgnore } = data;
	$: ({ settings, customFormattingSettings, gitIgnore } = data);

	import { dev } from '$app/environment';
	import DatabaseSettingsPanel from '$lib/ui/Databases/DatabaseSettingsPanel.svelte';
	import VersionControlPanel from '$lib/ui/VersionControl/VersionControlPanel.svelte';
	import DeploySettingsPanel from '$lib/ui/Deployment/DeploySettingsPanel.svelte';
	import FormattingSettingsPanel from '$lib/ui/Formatting/FormattingSettingsPanel.svelte';
	import TelemetrySettingsPanel from '$lib/ui/TelemetryOptOut/TelemetrySettingsPanel.svelte';
</script>

{#if dev}
	<DatabaseSettingsPanel {settings} {gitIgnore} />
	<VersionControlPanel {settings} />
	<DeploySettingsPanel {settings} />
	<FormattingSettingsPanel {settings} {customFormattingSettings} />
	<TelemetrySettingsPanel {settings} />
	<br />
{:else}
	<p>Settings are only available in development mode.</p>
{/if}
