<script>
	import { getReadonlyInputContext } from '@evidence-dev/sdk/utils/svelte';

	const inputs = getReadonlyInputContext();
</script>

<pre class="text-xs px-2 py-2 bg-base-200 my-2">{JSON.stringify($inputs, null, 2)}</pre>
