<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';

	const inputStore = writable({});

	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<slot />

<hr class="mt-8" />
<p>Input Store Value</p>
<pre>{JSON.stringify($inputStore, null, 2)}</pre>
