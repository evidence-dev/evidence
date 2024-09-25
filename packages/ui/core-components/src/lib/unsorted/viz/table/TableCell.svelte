<script>
	export let dataType = undefined;
	export let align = undefined;
	export let height = undefined;
	export let width = undefined;
	export let wrap = undefined;

	export let verticalAlign = 'middle';
	export let rowSpan = 1;
	export let colSpan = 1;
	export let show = true;
	export let cellColor = undefined;
	export let fontColor = undefined;

	export let topBorder = undefined;
	export let paddingLeft = undefined;
	export let borderBottom = undefined;

	export let compact = false;
</script>

<td
	role="cell"
	class="{$$restProps.class ||
		''} {dataType} {topBorder} whitespace-nowrap overflow-hidden first:pl-[3px]
	{compact ? 'text-xs py-[1px] px-[4px]' : 'py-[2px] px-[8px]'}
	"
	style:text-align={align}
	style:height
	style:width
	style:white-space={wrap ? 'normal' : 'nowrap'}
	style:vertical-align={verticalAlign}
	style:display={show ? undefined : 'none'}
	rowspan={rowSpan}
	colspan={colSpan}
	style:background-color={cellColor}
	style:color={fontColor}
	style:padding-left={paddingLeft}
	style:border-bottom={borderBottom}
>
	<slot />
</td>

<style>
	.string {
		text-align: left;
	}

	.date {
		text-align: left;
	}

	.number {
		text-align: right;
	}

	.boolean {
		text-align: left;
	}

	.index {
		color: var(--grey-300);
		text-align: left;
		max-width: -moz-min-content;
		max-width: min-content;
	}

	*:focus {
		outline: none;
	}
</style>
