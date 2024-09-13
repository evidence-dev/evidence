<script>
	import { RadioGroup, Label } from 'bits-ui';
	import { Icon } from '@steeze-ui/svelte-icon';
	/** @typedef {import("@steeze-ui/svelte-icon").IconSource} IconSource */

	/** @type {string} */
	export let name;

	/** @type {string} */
	export let label;

	/** @type {IconSource} */
	export let icon;

	/** @type {boolean | undefined} */
	export let selected;

	export const width = () => element?.offsetWidth;

	export const height = () => element?.offsetHeight;

	export const top = () => element?.offsetTop;

	export const left = () => element?.offsetLeft;

	/** @type {HTMLDivElement} */
	let element;
</script>

<div
	bind:this={element}
	class="flex flex-row items-center justify-center px-2 py-1 z-10 rounded-md transition {!selected &&
		'hover:bg-gray-200/30'}"
>
	<RadioGroup.Item id={name} value={name} class="absolute" />
	<Label.Root for={name} class="flex flex-row gap-2 items-center cursor-pointer">
		{label}
		<Icon src={icon} class="w-4 h-4" theme={selected ? 'filled' : 'outline'} />
	</Label.Root>
</div>
