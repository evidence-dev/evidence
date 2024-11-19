<script>
	import chroma from 'chroma-js';
	import { getThemeStores } from '../../../themes.js';

	const { theme, resolveColor } = getThemeStores();

	export let color = $theme.colors.primary;
	$: colorStore = resolveColor(color);

	export let id;

	export let label;

	export let activeId;

	$: bgColor = chroma($colorStore).alpha(0.05).css();
	$: borderColor = chroma($colorStore).alpha(0.5).css();

	const classes = {
		notActive: 'border-base-300 border-b-2 bg-base-200/25 border-b hover:bg-base-200',
		active: 'border-b-2 border-[--borderColor] bg-[--bgColor]'
	};
</script>

<button
	style:--bgColor={bgColor}
	style:--borderColor={borderColor}
	on:click
	class="mt-2 p-2 rounded-t flex-1 text-sm font-sans whitespace-nowrap transition ease-in active:bg-base-300 {activeId ===
	id
		? classes.active
		: classes.notActive}"
>
	{label}
</button>
