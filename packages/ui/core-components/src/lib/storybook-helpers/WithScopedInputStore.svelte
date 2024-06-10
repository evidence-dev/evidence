<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { setTrackProxy } from '@evidence-dev/sdk/usql';

	const inputStore = writable(
		setTrackProxy({
			label: '',
			value: '(SELECT NULL WHERE 0 /* An Input has not been set */)'
		})
	);
	setContext(INPUTS_CONTEXT_KEY, inputStore);
</script>

<slot />

<hr class="mt-8" />
<p>Input Store Value</p>
<pre>{JSON.stringify($inputStore, null, 2)}</pre>
