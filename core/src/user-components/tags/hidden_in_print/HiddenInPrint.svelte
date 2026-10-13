<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';

	let props: UserComponentProps<typeof schema> = $props();
</script>

<div class="contents print:hidden" data-print-visibility>
	{@render props.children?.()}
</div>
