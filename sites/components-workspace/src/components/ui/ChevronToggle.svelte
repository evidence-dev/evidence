<script>
    export let toggled = false 
    export let color = "#2d2d2d"
    export let size = 10
</script>

<span>
{#if toggled}
<svg viewBox="0 0 16 16" width={size} height={size}><path fill={color} fill-rule="evenodd" d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"></path></svg>
{:else}
<svg viewBox="0 0 16 16" width={size} height={size}><path fill={color} fill-rule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"></path></svg> 
{/if}
</span>

<style>

    svg{
        display: inline-block;
        vertical-align: middle;
    }

</style>