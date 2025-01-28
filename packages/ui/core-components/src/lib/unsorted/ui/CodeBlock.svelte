<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { fade } from 'svelte/transition';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { loadPrismComponents } from './prismLoader.js'; // Needed to avoid issues with loading Prism and prism languages out of order

	export let source;
	export let copyToClipboard = false;
	export let language = undefined;

	let copied = false;

	const toggleCopied = function () {
		copied = false;
	};

	async function copy() {
		try {
			await navigator.clipboard.writeText(source);
			copied = true;
			setTimeout(toggleCopied, 3000);
		} catch {
			/* ignore errors */
		}
	}

	$: if (browser) {
		tick().then(async () => {
			const Prism = await loadPrismComponents();
			if (typeof Prism !== 'undefined') {
				const codeElements = document.querySelectorAll(
					`pre code${language ? `.language-${language}` : ''}`
				);
				codeElements.forEach((codeElement) => {
					Prism.highlightElement(codeElement, false);
				});
			} else {
				console.error('Prism is not defined in reactive statement');
			}
		});
	}
</script>

<div class="mt-2 mb-4 bg-base-200 border border-base-300 rounded-md px-3 py-2 relative group">
	{#if copyToClipboard}
		<button
			class="absolute opacity-0 rounded p-1 group-hover:opacity-100 hover:bg-base-300/30 top-2 right-2 h-6 w-6 z-10 transition-all duration-200 ease-in-out text-base-content-muted active:bg-base-300/50"
			on:click={() => {
				if (source !== undefined) {
					copy(source);
				}
			}}
		>
			{#if copied}
				<svg
					fill="currentColor"
					viewBox="0 0 24 24"
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMid meet"
					in:fade|local
				>
					<path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 32 32"
					fill="currentColor"
					width="100%"
					height="100%"
					preserveAspectRatio="xMidYMid meet"
					in:fade|local
				>
					<path
						d="M28,10V28H10V10H28m0-2H10a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2Z"
					/><path d="M4,18H2V4A2,2,0,0,1,4,2H18V4H4Z" />
				</svg>
			{/if}
		</button>
	{/if}
	<pre class="overflow-auto pretty-scrollbar"><code class="language-{language} text-sm"
			>{#if source}{source}{:else}<slot />{/if}</code
		></pre>
</div>
