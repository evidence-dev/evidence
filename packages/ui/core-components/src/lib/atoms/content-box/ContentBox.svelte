<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { ChevronDown } from '@steeze-ui/tabler-icons';
	import { slide } from 'svelte/transition';

	export let togglable = false;
	export let defaultOpen = true;

	let open = defaultOpen;
</script>

<div class="h-fit bg-inherit">
	<section class="flex flex-col border p-4 relative border-base-300 bg-inherit w-full rounded cu">
		<button
			class="contents bg-inherit"
			class:cursor-default={!togglable}
			on:click={() => (open = !open)}
		>
			<header
				class="font-bold px-2 absolute -translate-y-1/2 top-0 left-4 bg-inherit flex gap-2 items-center"
			>
				<slot name="header" />

				{#if togglable}
					<Icon src={ChevronDown} class="h-4 w-4 transition-transform {open ? '' : 'rotate-180'}" />
				{/if}
			</header>
		</button>
		{#if (togglable && open) || !togglable}
			<div transition:slide>
				<slot />
			</div>
		{/if}
	</section>
</div>
