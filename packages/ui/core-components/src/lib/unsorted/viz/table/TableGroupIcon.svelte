<script>
	import { getThemeStores } from '../../../themes/themes.js';

	export let toggled = false;
	export let color = undefined;
	export let size = 10;

	const { theme } = getThemeStores();
</script>

<span aria-expanded={toggled} class="inline-flex">
	<svg viewBox="0 0 16 16" width={size} height={size}
		><path
			fill={color ?? $theme.colors['base-content']}
			fill-rule="evenodd"
			d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
		/></svg
	>
</span>

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
		transition: transform 0.15s ease-in;
	}

	span {
		margin: auto 0 auto 0;
	}

	[aria-expanded='true'] svg {
		transform: rotate(0.25turn);
	}
</style>
