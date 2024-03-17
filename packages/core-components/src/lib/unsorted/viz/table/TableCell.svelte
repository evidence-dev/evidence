<script>
	export let dataType;
	export let align;
	export let height;
	export let width;
	export let wrap;

	export let verticalAlign = 'middle';
	export let rowSpan = 1;
	export let colSpan = 1;
	export let show = true;
	export let cellColor;
	export let fontColor;

	export let topBorder;
	export let paddingLeft;
	export let padding;

	// left padding for first column of accordion group
</script>

<td
	class="{$$restProps.class ||
		''} {dataType} {topBorder} py-[2px] px-[8px] whitespace-nowrap overflow-hidden first:pl-[4px]"
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
	style:padding
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
