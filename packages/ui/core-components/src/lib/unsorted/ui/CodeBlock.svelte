<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import { loadPrismComponents } from './prismLoader.js'; // Needed to avoid issues with loading Prism and prism languages out of order

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

<div class="mt-2 mb-4 bg-base-200 border border-base-300 rounded px-3 py-2 relative group">
	{#if copyToClipboard}
		<button
			class={'absolute opacity-0 rounded-sm p-1 group-hover:opacity-100 top-2 right-2 h-6 w-6 z-10 transition-all duration-200 ease-in-out' +
				(copied ? '' : '')}
			on:click={() => {
				if (source !== undefined) {
					copy(source);
				}
			}}
		>
			{#if copied}
				<Success />
			{:else}
				<Copy />
			{/if}
		</button>
	{/if}
	<pre class="overflow-auto pretty-scrollbar"><code class="language-{language} text-sm"
			>{#if source}{source}{:else}<slot />{/if}</code
		></pre>
</div>
