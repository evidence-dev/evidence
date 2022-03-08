<script context="module">
    export const load = async ({fetch}) => {
        const res = await fetch("api/settings.json")
        const items = await res.json()

        return {
            props: {
                items
            }
        }
    }

</script>

<script>
    export let items
    let database = items.evidenceConfig.database
    import Settings from '$lib/ui/Settings.svelte'
</script>

<Settings database={database}/>