<script context="module">
    import { dev } from '$app/env'    
    export const load = async ({fetch}) => {
        if(dev) {
            const res = await fetch("../api/settings.json")
            const {settings} = await res.json()
            return {
                props: {
                    settings
                }
            }
        }
        else {
            return {
                props: {
                    settings: {}
                } 
            }
        }
    }
</script>

<script>
    export let settings 
    import DatabaseSettingsPanel from '@evidence-dev/components/ui/Databases/DatabaseSettingsPanel.svelte';
</script>

{#if dev}
<DatabaseSettingsPanel {settings}/> 
{:else}
<p>Settings are only available in development mode.</p>
{/if}
