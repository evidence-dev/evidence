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

	/** @type {import('./Button.svelte').ButtonVariant[]} */
	const variants = ['primary', 'secondary', 'accent', 'info', 'positive', 'warning', 'negative'];

	/** @type {import('./Button.svelte').ButtonSize[]} */
	const sizes = ['sm', 'md', 'base', 'lg'];

	const outlines = [false, true];

	const disableds = [false, true];
</script>

<Story name="All">
	<div class="grid grid-cols-3 gap-2">
		<span />
		{#each outlines as outline}
			<code>outline={outline}</code>
		{/each}
		{#each variants as variant}
			{#each disableds as disabled}
				<code>disabled={disabled}</code>
				{#each outlines as outline}
					<div class="flex flex-col gap-1 p-1 bg-base-100">
						{#each sizes as size}
							<span>
								<Button {variant} {disabled} {outline} {size}>Click me</Button>
							</span>
						{/each}
					</div>
				{/each}
			{/each}
		{/each}
	</div>
	<div style="height:200px" />
</Story>
