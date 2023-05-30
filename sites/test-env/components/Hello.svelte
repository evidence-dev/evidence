<script>
	export let query;
	import { BarChart } from '@evidence-dev/core-components';
</script>

<p>
	Here is a BarChart in a Component, with some accompanying text. Components stored in the
	/components/ folder will be included in your project.
</p>

<p>You import them using this in the script tag in your .md file:</p>

<code> import Hello from '$lib/Hello.svelte'; </code>

<BarChart data={query} />
