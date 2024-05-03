<script>
	import { INPUTS_CONTEXT_KEY } from '@evidence-dev/component-utilities/globalContexts';
	import { getContext } from 'svelte';

	const inputs = getContext(INPUTS_CONTEXT_KEY);
</script>

<slot {inputs} />
