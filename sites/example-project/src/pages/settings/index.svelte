<script context="module">
    import { dev } from '$app/env'    
    export const load = async ({fetch}) => {
        if(dev) {
            const res = await fetch("../api/settings.json")
            // const {settings} = await res.json()
            const bod = await res.json()
            const settings = bod.settings
            const gitIgnore = bod.gitIgnore
            return {
                props: {
                    settings,
                    gitIgnore 
                }
            }
        }
        else {
            return {
                props: {
                    settings: {},
                    gitIgnore: ""
                } 
            }
        }
    }
</script>

<script>
    export let settings 
    export let gitIgnore
    import DatabaseSettingsPanel from '@evidence-dev/components/ui/Databases/DatabaseSettingsPanel.svelte';
    import DeploySettingsPanel from '$lib/ui/Deployment/DeploySettingsPanel.svelte'
    import VersionControlPanel from '$lib/ui/VersionControl/VersionControlPanel.svelte'
</script>

{#if dev}
<DatabaseSettingsPanel {settings} {gitIgnore}/> 
<VersionControlPanel {settings}/>
<DeploySettingsPanel {settings} /> 
{:else}
<p>Settings are only available in development mode.</p>
{/if}
