<script>
    import {setButtonGroupContext} from './lib';
    import {derived, writable} from "svelte/store";
    import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';
    /** @type {string} */
    export let name;
    /** @type {string} */
    export let title;

	const inputs = getContext(INPUTS_CONTEXT_KEY);

    let currentValue = null;
    const valueStore = writable(null)
    $: valueStore.update(() => currentValue)
    $: $inputs[name] = currentValue?.value ?? null

    setButtonGroupContext((v) => currentValue = v, derived([valueStore], ([$v]) => $v))

</script>

<div class="inline-flex flex-col">
    {#if title}
        <span class="text-gray-500 block">{title}</span>
    {/if}
    <div class="inline-flex" role="group">
        <slot />
    </div>
</div>