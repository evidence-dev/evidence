<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let source;
	export let copyToClipboard = false;
	import Copy from './Deployment/CopyIcon.svelte';
	import Success from './Deployment/CopySuccessIcon.svelte';
	let copied = false;

	const toggleCopied = function () {
		copied = false;
	};

	async function copy() {
		try {
			await navigator.clipboard.writeText(source);
			copied = true;
			setTimeout(toggleCopied, 1500);
		} catch {
			/* ignore errors */
		}
	}
</script>

<pre class="my-5 relative">
	<div class="absolute" style="height:100%;width:100%">
		{#if copyToClipboard}
			<button
				type="button"
				class="container absolute right-0 top-0 h-8 w-8 transition-all duration-200 ease-in-out"
				class:copied
				on:click={() => {
					if (source !== undefined) {
						copy(source);
					}
				}}>
					{#if copied}
					<Success color="var(--green-500)" />
				{:else}
					<Copy />
				{/if}
		</button>
		{/if}
		</div>
<code
		>{#if source}{source}
		{:else}<slot />
		{/if}
</code>		
</pre>

<style>
	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}
	pre {
		@apply bg-gray-50 border rounded-md flex items-start justify-between;
	}
	pre code::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	pre code::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	pre code::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	pre code::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	pre code::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	pre code::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	pre code {
		@apply overflow-auto relative block p-3 text-gray-900 text-sm;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}

	pre button.container {
		opacity: 0;
		box-sizing: border-box;
		background-color: var(--grey-100);
		border-radius: 4px 4px 4px 4px;
		border: 1px solid var(--grey-300);
		padding: 0.25em 0.35em 0.25em 0.35em;
		color: var(--grey-300);
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		margin: 0.5em;
		display: flex;
		z-index: 20;
		align-items: center;
		justify-content: center;
	}

	pre:hover button.container {
		@apply bg-gray-50 text-gray-500 border-gray-200 rounded;
		opacity: 1;
		padding: 0.25em 0.35em 0.25em 0.35em;
		cursor: pointer;
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		margin: 0.5em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	pre button.container:hover {
		@apply border-gray-500 text-gray-500;
	}

	pre button.container.copied {
		@apply text-green-600 border-gray-500;
	}
</style>
