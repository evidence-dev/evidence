<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { toBoolean } from '$lib/utils.js';
	export let enabled = true;

	$: enabled = toBoolean(enabled);
</script>

<div class:print:hidden={enabled} class="contents">
	<slot />
</div>
