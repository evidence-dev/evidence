<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';

	let props: UserComponentProps<typeof schema> = $props();
</script>

<div class="hidden print:contents" data-print-visibility data-print-only>
	{@render props.children?.()}
</div>
