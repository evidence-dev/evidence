<script lang="ts" module>
	const ALIGN_MAP: Record<UserComponentProps<typeof schema>['align'], string> = {
		left: 'start',
		center: 'center',
		right: 'end',
		stretch: 'stretch'
	};
</script>

<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import { cn } from '../../../shadcn/utils';
	import { setCardContext } from '../../common/card-context.svelte';
	import { getThemeContext } from '../../../theme/theme.context.svelte';

	const props: UserComponentProps<typeof schema> = $props();

	const align = $derived(props.align);
	const card = $derived(props.card);
	const children = $derived(props.children);

	// Get page settings to check if cards are enabled
	const pageSettingsGetter = getPageSettingsContext();
	const pageSettings = $derived(pageSettingsGetter());

	const themeContext = getThemeContext();
	const isFlush = $derived(themeContext.activeTheme.density === 'flush');

	// Set card context to prevent children from getting individual cards when card=true
	setCardContext({
		get insideCard() {
			return card;
		}
	});
</script>

<div
	class={cn(
		'gap-report flex size-full shrink-0 flex-col *:w-auto print:h-auto',
		// Apply card styling when card is enabled and page cards are enabled
		card &&
			pageSettings.cards &&
			'bg-background p-card-pad rounded-md border shadow-xs print:shadow-none',
		// Flush density: child corners/borders are driven by base.css rules
		// (vertical never wraps, so pure first/last-child CSS suffices)
		isFlush && !card && 'flush-stack'
	)}
	style="align-items:{ALIGN_MAP[align]};"
>
	{@render children?.()}
</div>
