<script>
    import {slide} from 'svelte/transition'

    let open = false;
</script>
{#if open}
<div class="h-screen w-96 bg-slate-700 fixed overflow-auto right-0 top-0 pt-12 text-slate-50 px-2" transition:slide>
</div>
{/if}

<div class="fixed right-4 bottom-4 rounded-full bg-blue-200">

</div>
<slot />