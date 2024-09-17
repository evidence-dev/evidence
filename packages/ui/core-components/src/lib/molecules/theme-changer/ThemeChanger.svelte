<script>
	// @ts-check

	import { RadioGroup } from 'bits-ui';
	import { Sun, Moon } from '@steeze-ui/tabler-icons';

	import { ensureThemeStores } from './theme-stores.js';
	import ThemeChangerOption from './ThemeChangerOption.svelte';

	const { systemTheme, selectedTheme } = ensureThemeStores();

	// TODO the width isn't correct shortly after mount on System - maybe due to icon shifting?
	/** @type {ThemeChangerOption | undefined} */
	let systemElement;
	/** @type {ThemeChangerOption | undefined} */
	let lightElement;
	/** @type {ThemeChangerOption | undefined} */
	let darkElement;

	$: element =
		$selectedTheme === 'system'
			? systemElement
			: $selectedTheme === 'light'
				? lightElement
				: darkElement;
</script>

<RadioGroup.Root
	class="relative w-fit h-fit flex flex-row gap-2 items-center bg-gray-100 shadow-inner p-1 rounded-lg text-sm"
	bind:value={$selectedTheme}
>
	<div
		style="width: {element?.width()}px; height: {element?.height()}px; top: {element?.top()}px; left: {element?.left()}px; transition: all 0.15s ease; box-shadow: rgba(255, 255, 255, 0.1) 0px 1px 0px inset"
		class="absolute bg-gray-200 rounded-md"
	/>

	<ThemeChangerOption
		bind:this={systemElement}
		name="system"
		label="System"
		icon={$systemTheme === 'light' ? Sun : Moon}
		selected={$selectedTheme === 'system'}
	/>
	<ThemeChangerOption
		bind:this={lightElement}
		name="light"
		label="Light"
		icon={Sun}
		selected={$selectedTheme === 'light'}
	/>
	<ThemeChangerOption
		bind:this={darkElement}
		name="dark"
		label="Dark"
		icon={Moon}
		selected={$selectedTheme === 'dark'}
	/>
</RadioGroup.Root>
