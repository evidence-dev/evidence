<script context="module">
	export const evidenceInclude = true;
</script>

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
		border-radius: 4px;
		padding: 0.3em 0.75em;
		margin: 1em 0;
		/* box-shadow: 0 10px 20px rgba(0,0,0,.15);
        box-shadow: 0 3px 6px rgba(0,0,0,.10); */
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
		font-size: 0.7em;
		font-family: var(--monospace-font-family);
		display: flex;
		justify-content: space-between;
		/* font-weight: 600; */
	}

	div.running {
		border: 1px solid var(--grey-400);
		background-color: white;
		color: var(--grey-999);
		transition: all 400ms;
	}

	div.error {
		border: 1px solid var(--red-500);
		background-color: var(--red-100);
		color: var(--red-999);
		transition: all 400ms;
	}

	div.done {
		border: 1px solid var(--green-500);
		background-color: var(--green-100);
		color: var(--green-999);
		transition: all 400ms;
	}

	span {
		cursor: pointer;
	}

	span.queryID {
		font-weight: bold;
	}

	@media print {
		#toast {
			display: none;
		}
	}
</style>
