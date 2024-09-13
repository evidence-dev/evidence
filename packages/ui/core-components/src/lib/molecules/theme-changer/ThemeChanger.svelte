<script>
	// @ts-check

	import { RadioGroup } from 'bits-ui';
	import { Sun, Moon } from '@steeze-ui/tabler-icons';
	import { writable } from 'svelte/store';
	import ThemeChangerOption from './ThemeChangerOption.svelte';
	import { createSystemThemeStore } from './system-theme-store.js';

	/** @template T @typedef {import("svelte/store").Writable<T>} Writable */

	/** @type {'system' | 'light' | 'dark'} */
	let selected = 'system';

	const systemTheme = createSystemThemeStore();

	/** @type {Writable<'light' | 'dark'>}*/
	const theme = writable('light');

	$: {
		if (selected === 'system') {
			$theme = $systemTheme;
		} else {
			$theme = selected;
		}
	}

	// TODO the width isn't correct shortly after mount on System - maybe due to icon shifting?
	/** @type {ThemeChangerOption | undefined} */
	let systemElement;
	/** @type {ThemeChangerOption | undefined} */
	let lightElement;
	/** @type {ThemeChangerOption | undefined} */
	let darkElement;

	$: element =
		selected === 'system' ? systemElement : selected === 'light' ? lightElement : darkElement;
</script>

<RadioGroup.Root
	class="relative w-fit h-fit flex flex-row gap-2 items-center bg-gray-100 shadow-inner p-1 rounded-lg text-sm"
	bind:value={selected}
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
		selected={selected === 'system'}
	/>
	<ThemeChangerOption
		bind:this={lightElement}
		name="light"
		label="Light"
		icon={Sun}
		selected={selected === 'light'}
	/>
	<ThemeChangerOption
		bind:this={darkElement}
		name="dark"
		label="Dark"
		icon={Moon}
		selected={selected === 'dark'}
	/>
</RadioGroup.Root>
