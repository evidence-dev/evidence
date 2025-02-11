<script>
	/** @typedef {import('@evidence-dev/sdk/plugins').DatasourceSpec} DatasourceSpec */

	import { blur } from 'svelte/transition';

	import { Button } from '$lib/atoms/button';

	/** @type {DatasourceSpec[]} */
	export let sources;

	let copied = false;

	const toggleCopied = function () {
		copied = false;
	};

	function copyVars() {
		const vars = sources.reduce((a, v) => {
			return [
				a,
				Object.entries(v.environmentVariables)
					.map(([k, v]) => `${k}="${v.replace(/\\n/g, '\n')}"`)
					.join('\n')
			].join('\n');
		}, '');
		navigator.clipboard.writeText(vars);
		copied = true;
		setTimeout(toggleCopied, 2000);
	}
</script>

<Button on:click={copyVars} type="button" class="w-full mt-4" size="xl">
	{#if copied}
		<span in:blur|local> Copied </span>
	{:else}
		<span in:blur|local> Copy Project Environment Variables </span>
	{/if}
</Button>
