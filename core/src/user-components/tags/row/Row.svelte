<script lang="ts" module>
	const ALIGN_MAP: Record<UserComponentProps<typeof schema>['align'], string> = {
		top: 'start',
		center: 'center',
		bottom: 'end',
		stretch: 'stretch'
	};
</script>

<script lang="ts">
	import type { UserComponentProps } from '../../types';
	import type { schema } from './schema';
	import { onMount } from 'svelte';
	import { getPageSettingsContext } from '../../../page-settings.context';
	import { cn } from '../../../shadcn/utils';
	import { setCardContext } from '../../common/card-context.svelte';
	import { getThemeContext } from '../../../theme/theme.context.svelte';
	import { COMPONENT_WRAPPER_CLASS } from '../../common/ComponentWrapper.svelte';
	import { groupIntoLines, widthChildShouldGrow, type ChildLayout } from './row-grouping';
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

	/*
		In order to make sure every row is filled edge-to-edge when the flex container wraps its children (flex-wrap),
		we dynamically set `grow: 0/1` on items that have a set width when they have no other siblings
		in the same wrapped row without a set width (if they do have such a sibling, that sibling should be the one growing
		to fill space).

		For example - with a layout like this:
		First item has width=20%, second item has no width set so it grows to fill the remaining space
		┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
		│ ┌──────────────────┐ ┌─────────────────────────────────────────────────────────────────────────┐ │
		│ │                  │ │                                                                         │ │
		│ │    width=20%     │ │                               width=unset                               │ │
		│ │                  │ │                                                                         │ │
		│ └──────────────────┘ └─────────────────────────────────────────────────────────────────────────┘ │
		└──────────────────────────────────────────────────────────────────────────────────────────────────┘

		When wrapping occurs (because one item shrinks beyond its minimum width) the layout _would_ end up like this
		(the first item stays at 20% width and doesn't fill its row, resulting in blank space)
		┌──────────────────────────────────────────┐
		│ ┌───────┐                                │
		│ │       │                                │
		│ │ width │                                │
		│ │  20%  │                                │
		│ │       │                                │
		│ └───────┘                                │
		| ┌──────────────────────────────────────┐ │
		| │                                      │ │
		| │             width=unset              │ │
		| │                                      │ │
		| └──────────────────────────────────────┘ │
		└──────────────────────────────────────────┘

		Instead, because of the code below, the first item grows to fill the empty space left after wrapping
		┌──────────────────────────────────────────┐
		│ ┌──────────────────────────────────────┐ │
		│ │                                      │ │
		│ │          width=20%, grow=1           │ │
		│ │                                      │ │
		│ └──────────────────────────────────────┘ │
		| ┌──────────────────────────────────────┐ │
		| │                                      │ │
		| │             width=unset              │ │
		| │                                      │ │
		| └──────────────────────────────────────┘ │
		└──────────────────────────────────────────┘
	*/
	let element: HTMLElement = $state(null!);
	onMount(() => {
		updateChildrenStyles();
		const resizeObserver = new ResizeObserver(() => updateChildrenStyles());
		resizeObserver.observe(element);

		return () => {
			resizeObserver.disconnect();
		};
	});

	const updateChildrenStyles = (): void => {
		// All element children participate in line grouping and flush position
		// assignment. The flex-grow decision (updateChildStyles) only considers
		// component-wrapper siblings, so bare markdown elements never affect it.
		const children = [...element.querySelectorAll(':scope > *')].filter(
			(child): child is HTMLElement => child instanceof HTMLElement
		);

		const rects = children.map((child) => {
			const { left, right } = child.getBoundingClientRect();
			return { left, right };
		});
		const lines = groupIntoLines(rects).map((line) => line.map((index) => children[index]!));

		lines.forEach((line, lineIndex) => {
			line.forEach((child, positionInLine) => {
				updateChildStyles(child, line);
				updateFlushPosition(child, positionInLine, line.length, lineIndex, lines.length);
			});
		});

		// Rows made entirely of inputs aren't pilled — they get a small,
		// consistent gutter (base.css .flush-row-inputs) instead of the 0
		// gutter cards tile at, and each input keeps its own theme rounding.
		element.classList.toggle(
			'flush-row-inputs',
			isFlush &&
				!card &&
				children.length > 0 &&
				children.every((child) => FLUSH_INPUT_TYPES.has(child.dataset.componentType ?? ''))
		);
	};

	const positionName = (index: number, count: number): string => {
		if (count === 1) return 'only';
		if (index === 0) return 'first';
		if (index === count - 1) return 'last';
		return 'mid';
	};

	// Mirrors FILTER_INPUT_COMPONENTS in process-markdoc.ts (kept local: the
	// shared isFilterInputComponent helper imports the full tag registry,
	// which would be circular from inside a tag)
	const FLUSH_INPUT_TYPES = new Set([
		'dropdown',
		'text_input',
		'date_grain_selector',
		'comparison_selector',
		'range_calendar',
		'toggle',
		'button_group',
		'table_filter',
		'slider'
	]);

	// Flush density: record each card tile's measured grid position so base.css
	// can round only the group's outer corners and dedupe internal borders.
	// Driven by the same line grouping as the flex-grow logic, so it stays
	// correct across flex-wrap (responsive re-pilling). Inputs are excluded —
	// they aren't pilled (see .flush-row-inputs) and keep their own rounding.
	const updateFlushPosition = (
		child: HTMLElement,
		childIndex: number,
		lineLength: number,
		lineIndex: number,
		lineCount: number
	): void => {
		const isInput = FLUSH_INPUT_TYPES.has(child.dataset.componentType ?? '');
		if (isFlush && !card && !isInput) {
			child.dataset.flushX = positionName(childIndex, lineLength);
			child.dataset.flushY = positionName(lineIndex, lineCount);
		} else {
			delete child.dataset.flushX;
			delete child.dataset.flushY;
		}
	};

	const layoutOf = (el: HTMLElement): ChildLayout => ({
		isWrapper: el.classList.contains(COMPONENT_WRAPPER_CLASS),
		hasWidth: Boolean(el.dataset['width'])
	});

	// Only width-set children are adjusted; everything else keeps its default
	// grow. The grow decision considers component siblings only — bare markdown
	// elements on the line are ignored (see widthChildShouldGrow).
	const updateChildStyles = (child: HTMLElement, line: HTMLElement[]): void => {
		if (!child.dataset['width']) return;
		const others = line.filter((other) => other !== child).map(layoutOf);
		child.style.flexGrow = widthChildShouldGrow(layoutOf(child), others) ? '1' : '0';
	};

	// Re-assign (or clean up) flush positions when the density token changes
	$effect(() => {
		void isFlush;
		if (element) updateChildrenStyles();
	});
</script>

<div
	bind:this={element}
	class={cn(
		'gap-report flex size-full flex-row flex-wrap *:h-auto',
		// Apply card styling when card is enabled and page cards are enabled
		card && pageSettings.cards && 'bg-card p-card-pad rounded-md border shadow-xs',
		// Flush density: child corners/borders are driven by base.css rules off
		// the data-flush-x/y attributes assigned in updateChildrenStyles
		isFlush && !card && 'flush-row'
	)}
	style="align-items:{ALIGN_MAP[align]};"
>
	{@render children?.()}
</div>
