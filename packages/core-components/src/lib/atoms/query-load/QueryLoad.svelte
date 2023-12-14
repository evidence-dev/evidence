<script>
    import {Skeleton} from "../skeletons"
    /** @type {import("@evidence-dev/query-store).QueryStore | unknown}*/
    export let data
</script>

{#if !data || !data?.__isQueryStore}
    <!-- Not a query store, nothing to be done -->
    <slot/>
{:else if !data?.loaded && !data.error}
    <!-- Data is loading -->
    <slot name="skeleton">
        <div class="w-full h-64">
            <Skeleton />
        </div>
    </slot>
{:else if data.error}
    <slot name="error"/>
{:else}
    <slot/>
{/if}