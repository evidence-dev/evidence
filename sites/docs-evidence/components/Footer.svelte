<script>
    import BigLink from "@evidence-dev/components/ui/BigLink.svelte";
    export let prev=false;
    export let next=false;
    export let prevLabel=false;
    export let nextLabel=false;
</script>

<div class="footer">
    {#if prev}<BigLink href={prev}>{#if prevLabel}&laquo; {prevLabel}{:else}&laquo; Prev Page{/if}</BigLink>{:else}<div></div>{/if}
    {#if next}<BigLink href={next}>{#if nextLabel}{nextLabel} &raquo;{:else}Next Page &raquo;{/if}</BigLink>{:else}<div></div>{/if}
</div>

<style>
    .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
    }   
</style>

