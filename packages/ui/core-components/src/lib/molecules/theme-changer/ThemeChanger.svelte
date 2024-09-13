<script>
	// @ts-check

	import { RadioGroup } from 'bits-ui';
	import { Sun, Moon, DeviceDesktop } from '@steeze-ui/tabler-icons';
	import { writable } from 'svelte/store';
	import ThemeChangerOption from './ThemeChangerOption.svelte';

	/** @template T @typedef {import("svelte/store").Writable<T>} Writable */

	// TODO should we call it auto or system?
	/** @type {Writable<'system' | 'light' | 'dark'>}*/
	const theme = writable('system');

	/** @type {ThemeChangerOption | undefined} */
	let system;
	/** @type {ThemeChangerOption | undefined} */
	let light;
	/** @type {ThemeChangerOption | undefined} */
	let dark;

	$: element = $theme === 'system' ? system : $theme === 'light' ? light : dark;
</script>

<RadioGroup.Root
	class="relative w-fit h-fit flex flex-row gap-2 items-center bg-gray-100 shadow-inner p-1 rounded-lg text-sm"
	bind:value={$theme}
>
	<div
		style="width: {element?.width()}px; height: {element?.height()}px; top: {element?.top()}px; left: {element?.left()}px; transition: all 0.15s ease; box-shadow: rgba(255, 255, 255, 0.1) 0px 1px 0px inset"
		class="absolute bg-gray-200 rounded-md"
	/>

	<ThemeChangerOption
		bind:this={system}
		name="system"
		label="System"
		icon={DeviceDesktop}
		selected={$theme === 'system'}
	/>
	<ThemeChangerOption
		bind:this={light}
		name="light"
		label="Light"
		icon={Sun}
		selected={$theme === 'light'}
	/>
	<ThemeChangerOption
		bind:this={dark}
		name="dark"
		label="Dark"
		icon={Moon}
		selected={$theme === 'dark'}
	/>
</RadioGroup.Root>
