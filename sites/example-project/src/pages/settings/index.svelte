<script context="module">
  import { dev } from "$app/env";
  export const load = async ({ fetch }) => {
    if (dev) {
      const settingsRes = await fetch("../api/settings.json");
      const customFormattingSettingsRes = await fetch("../api/customFormattingSettings.json");
      const { settings, gitIgnore } = await settingsRes.json();
      const { customFormattingSettings } = await customFormattingSettingsRes.json();
      return {
        props: {
          settings,
          gitIgnore,
          customFormattingSettings,
        },
      };
    } else {
      return {
        props: {
          settings: {},
          gitIgnore: "",
        },
      };
    }
  };
</script>

<script>
  export let settings;
  export let customFormattingSettings;
  export let gitIgnore;
  import DatabaseSettingsPanel from "@evidence-dev/components/ui/Databases/DatabaseSettingsPanel.svelte";
  import VersionControlPanel from "@evidence-dev/components/ui/VersionControl/VersionControlPanel.svelte";
  import DeploySettingsPanel from "@evidence-dev/components/ui/Deployment/DeploySettingsPanel.svelte";
  import FormattingSettingsPanel from "$lib/ui/Formatting/FormattingSettingsPanel.svelte";
  import TelemetrySettingsPanel from "@evidence-dev/components/ui/TelemetryOptOut/TelemetrySettingsPanel.svelte";
</script>

{#if dev}
  <DatabaseSettingsPanel {settings} {gitIgnore} />
  <VersionControlPanel {settings} />
  <DeploySettingsPanel {settings} />
  <TelemetrySettingsPanel {settings} />
  <FormattingSettingsPanel {settings} {customFormattingSettings} />
  <br />
{:else}
  <p>Settings are only available in development mode.</p>
{/if}
