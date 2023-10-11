<script>
	import { delay } from '../delay';
	import { onMount } from 'svelte';
	import { scale, fly } from 'svelte/transition';

	export let status;
	let visible = true;

	onMount(async () => {
		// auto-hide the toast after a while
		await delay(5000);
		visible = false;
	});
</script>

{#if visible}
	<div
		id="toast"
		class:running={status.status === 'running' || status.status === 'not run'}
		class:error={status.status === 'error'}
		class:done={status.status === 'done' || status.status === 'from cache'}
		in:scale
		out:fly|local={{ x: 1000, duration: 1000, delay: 0, opacity: 0.8 }}
	>
		<span class="queryID">
			{status.id}
		</span>
		<span class="status">
			{status.status}
		</span>
	</div>
{/if}

<style>
	#toast {
		@apply rounded px-2 py-1 my-3 shadow text-xs flex gap-2 justify-between print:hidden;
	}

	div.running {
		@apply border border-gray-400 bg-white text-gray-800; 
	}

	div.error {
		@apply border-red-200 border bg-red-50 text-red-800 transition-all duration-300;	
	}

	div.done {
		@apply border-green-300 border bg-green-100 text-green-900 transition-all duration-300;
	}

	span.queryID {
		@apply truncate;
	}

	span.status {
		@apply font-medium;
	}

</style>
