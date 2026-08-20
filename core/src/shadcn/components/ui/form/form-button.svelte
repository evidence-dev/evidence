<script lang="ts">
	import * as Button from '../../../../shadcn/components/ui/button/index.js';

	let { ref = $bindable(null), ...restProps }: Button.Props = $props();
</script>

<Button.Root bind:ref type="submit" {...restProps} />
