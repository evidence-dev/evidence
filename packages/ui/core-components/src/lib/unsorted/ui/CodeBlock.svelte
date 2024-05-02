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

<div class="my-5 bg-gray-50 border border-gray-200 rounded px-3 py-1 relative group">
	{#if copyToClipboard}
		<button
			class={'absolute opacity-0 bg-gray-50 rounded-sm p-1 group-hover:opacity-100 top-4 right-6 h-6 w-6 z-10 transition-all duration-200 ease-in-out' + (copied ? '' : '')}
			on:click={() => {
				if (source !== undefined) {
					copy(source);
				}
			}}
		>
			{#if copied}
				<Success color="var(--green-500)" />
			{:else}
				<Copy />
			{/if}
		</button>
	{/if}
	<pre class="overflow-auto max-h-64 pretty-scrollbar"><code class="language-{language} text-sm"
			>{#if source}{source}{:else}<slot />{/if}</code
		></pre>
</div>
