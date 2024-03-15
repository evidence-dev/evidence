<script>
	import * as BaseTabs from '../shadcn/tabs/index.js';
	import { getContext } from 'svelte';

	/** @type {string} */
	export let label;
	/** @type {boolean} */
	export let well;

	const tabs = getContext('TAB_REGISTRATION');

	$tabs = [...$tabs, label];
</script>

<BaseTabs.Content value={label} {well}>
	<div class="mb-4">
		<slot />
	</div>
</BaseTabs.Content>
