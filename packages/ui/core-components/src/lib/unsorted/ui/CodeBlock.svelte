<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { onMount, tick } from 'svelte';
	import Prism from 'prismjs';
	import './prism-svelte.js';
	import 'prismjs/components/prism-bash';
	import 'prismjs/components/prism-sql';
	import 'prismjs/components/prism-python';
	import 'prismjs/components/prism-markdown';
	// import 'prismjs/themes/prism-tomorrow.css'; // theme not taking effect at the moment

	export let source;
	export let copyToClipboard = false;
	export let language = undefined;
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

	onMount(() => {
		Prism.highlightAll();
	});

	$: source,
		tick().then(() => {
			const codeElement = document.querySelector(`pre code.language-${language}`);
			if (codeElement) {
				Prism.highlightElement(codeElement, false);
			}
		});
</script>

<pre
	class="my-5 relative"
	style="overflow-y:hidden;border: 1px solid var(--grey-200);display:flex;align-items:flex-start;justify-content:space-between;">
	<div class="absolute" style="height:100%;width:100%">
		{#if copyToClipboard}
			<button
				type="button"
				class="container absolute right-0 top-0 h-7 w-7 transition-all duration-200 ease-in-out"
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
<code class="language-{language}" style="overflow:auto;position:relative;display:block;"
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
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		border-radius: 0.3rem;
		border-width: 1px;
		--tw-bg-opacity: 1;
		background-color: rgb(249 250 251 / var(--tw-bg-opacity));
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
		position: relative;
		display: block;
		overflow: auto;
		padding: 0.7rem;
		font-size: 0.8rem;
		line-height: 1.25rem;
		--tw-text-opacity: 1;
		color: rgb(17 24 39 / var(--tw-text-opacity));
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
		border-radius: 0.25rem;
		--tw-border-opacity: 1;
		border-color: rgb(229 231 235 / var(--tw-border-opacity));
		--tw-bg-opacity: 1;
		background-color: rgb(249 250 251 / var(--tw-bg-opacity));
		--tw-text-opacity: 1;
		color: rgb(107 114 128 / var(--tw-text-opacity));
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
		--tw-border-opacity: 1;
		border-color: rgb(107 114 128 / var(--tw-border-opacity));
		--tw-text-opacity: 1;
		color: rgb(107 114 128 / var(--tw-text-opacity));
	}

	pre button.container.copied {
		--tw-border-opacity: 1;
		border-color: rgb(107 114 128 / var(--tw-border-opacity));
		--tw-text-opacity: 1;
		color: rgb(22 163 74 / var(--tw-text-opacity));
	}
</style>
