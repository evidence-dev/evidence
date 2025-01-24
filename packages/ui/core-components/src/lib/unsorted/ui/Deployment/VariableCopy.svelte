<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { blur } from 'svelte/transition';
	import Copy from './CopyIcon.svelte';
	export let text = undefined;
	export let hideText = false;
	export let small = false;
	let copied = false;

	const toggleCopied = function () {
		copied = false;
	};

	export let copy = async (text) => {
		try {
			if (!copied) {
				await navigator.clipboard.writeText(text);
				copied = true;
				setTimeout(toggleCopied, 2000);
			}
		} catch {
			/* ignore errors */
		}
	};
</script>

<button
	type="button"
	class="container h-6 w-6 hover:border-info hover:bg-info/10 hover:text-info
	active:border-positive active:bg-positive/10 active:text-positive
	{copied ? 'border-positive bg-positive/10 text-positive' : ''}"
	on:click={() => {
		if (text !== undefined) {
			copy(text);
		}
	}}
>
	<span class="var-value">
		{#if copied}
			<span in:blur>Copied</span>
		{:else}
			<span in:blur class:text-xs={small}>
				{@html hideText
					? '&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;'
					: text}
			</span>
		{/if}
	</span>
	<div class="w-4 h-4">
		{#if copied}
			<Copy class="bx--snippet__icon" />
		{:else}
			<Copy class="bx--snippet__icon" />
		{/if}
	</div>
</button>

<style>
	button.container {
		box-sizing: border-box;
		background-color: var(--base-200);
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--base-300);
		padding: 0.9em 0.35em;
		size: 0.75em;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		transition: all 400ms;
		width: 100%;
		font-family: var(--monospace-font-family);
		line-height: 1.6;
		font-size: inherit;
	}

	button.container:hover {
		transition: all 400ms;
	}

	button.container:active,
	button.container.copied {
	}

	span.var-value {
		width: 85%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: left;
	}
</style>
