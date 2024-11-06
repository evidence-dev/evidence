<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { buildUrl } from '@evidence-dev/sdk/utils/svelte';
	export let href;
</script>

<a href={buildUrl(href)}>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>

<style>
	div {
		border: 1px solid var(--grey-200);
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
		color: var(--blue-600);
	}

	a:hover {
		text-decoration: none;
		color: var(--blue-700);
	}

	div:hover {
		border: 1px solid var(--grey-300);
		transition: all 400ms;
		box-shadow: 0 5px 5px 2px hsl(0deg 0% 97%);
	}
</style>
