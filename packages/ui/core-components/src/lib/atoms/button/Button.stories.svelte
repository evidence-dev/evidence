<script context="module">
	import Button from './Button.svelte';

	/** @type {import("@storybook/svelte").Meta}*/
	export const meta = {
		title: 'Atoms/Button',
		component: Button
	};
</script>

<script>
	import { Story } from '@storybook/addon-svelte-csf';
	import { ServerCog } from '@evidence-dev/component-utilities/icons';

	/** @type {import('./Button.svelte').ButtonVariant[]} */
	const variants = ['default', 'primary', 'destructive', 'muted', 'ghost', 'link'];

	/** @type {import('./Button.svelte').ButtonSize[]} */
	const sizes = ['default', 'lg', 'xl'];
</script>

<Story name="All Variants">
	{#each variants as variant}
		<div class="w-full bg-base-200 px-2 py-1 text-sm rounded border mt-4">
			<span class="capitalize">{variant}</span>
		</div>
		<div class="flex flex-col gap-4 py-4">
			{#each sizes as size}
				<div class="flex justify-between">
					<Button {variant} {size}>Save</Button>
					<span class="capitalize text-secondary">
						{size}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</Story>

<Story name="Icon Left">
	{#each variants as variant}
		<div class="w-full bg-base-200 px-2 py-1 text-sm rounded border mt-4">
			<span class="capitalize">{variant}</span>
		</div>
		<div class="flex flex-col gap-4 py-4">
			{#each sizes as size}
				<div class="flex justify-between">
					<Button {variant} {size} icon={ServerCog} iconPosition="left">Configure</Button>
					<span class="capitalize text-secondary">
						{size}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</Story>

<Story name="Icon Right">
	{#each variants as variant}
		<div class="w-full bg-base-200 px-2 py-1 text-sm rounded border mt-4">
			<span class="capitalize">{variant}</span>
		</div>
		<div class="flex flex-col gap-4 py-4">
			{#each sizes as size}
				<div class="flex justify-between">
					<Button {variant} {size} icon={ServerCog}>Configure</Button>
					<span class="capitalize text-secondary">
						{size}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</Story>

<Story name="Disabled">
	{#each variants as variant}
		<div class="w-full bg-base-200 px-2 py-1 text-sm rounded border mt-4">
			<span class="capitalize">{variant}</span>
		</div>
		<div class="flex flex-col gap-4 py-4">
			{#each sizes as size}
				<div class="flex justify-between">
					<Button {variant} {size} disabled>Save</Button>
					<span class="capitalize text-secondary">
						{size}
					</span>
				</div>
			{/each}
		</div>
	{/each}
</Story>

<Story name="Custom Classes">
	<span class="font-mono text-xs bg-base-200 w-full rounded px-2 py-1 border">
		class='w-full mt-6'
	</span>
	{#each variants as variant}
		<Button {variant} class="w-full mt-6">Save</Button>
	{/each}
</Story>
