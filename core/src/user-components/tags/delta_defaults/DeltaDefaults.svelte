<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { setDeltaDefaultsContext } from '../delta/delta-defaults.context.svelte';
	import { coerceBoolean } from '../../common/process-variables';

	const props: UserComponentProps<typeof schema> = $props();

	const down_is_good = $derived(
		coerceBoolean(props.down_is_good) ?? coerceBoolean(props.downIsGood) ?? undefined
	);
	const children = $derived(props.children);

	setDeltaDefaultsContext({
		get downIsGood() {
			return down_is_good;
		}
	});
</script>

{@render children?.()}
