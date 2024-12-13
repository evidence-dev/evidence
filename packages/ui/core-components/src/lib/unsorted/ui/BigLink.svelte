<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { addBasePath } from '@evidence-dev/sdk/utils/svelte';
	export let href;
</script>

<a href={addBasePath(href)}>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>

<style lang="postcss">
	div {
		@apply border border-base-300 hover:shadow-md shadow-base-100;
		border-radius: 6px;
		padding: 0.3em 0.6em;
		font-family: var(--ui-font-family);
		font-size: 0.8em;
		margin-top: 1em;
		margin-bottom: 1.25em;
		cursor: pointer;
		transition: all 400ms;
	}

	a {
		text-decoration: none;
		color: var(--primary);
	}

	a:hover {
		text-decoration: none;
		filter: brightness(80%);
	}
</style>
