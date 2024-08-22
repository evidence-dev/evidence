<script>
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Sun, Moon } from '@steeze-ui/radix-icons';

	import { resetMode, setMode } from 'mode-watcher';
	import { Button } from '$lib/atoms/shadcn/button/index.js';
	import * as DropdownMenu from '$lib/atoms/shadcn/dropdown-menu/index.js';
	import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher />

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="icon">
			<Icon
				src={Sun}
				class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0 text-foreground"
			/>
			<Icon
				src={Moon}
				class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100 text-foreground"
			/>
			<span class="sr-only">Toggle dark or light mode</span>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item on:click={() => setMode('light')} class="text-foreground">Light</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => setMode('dark')} class="text-foreground">Dark</DropdownMenu.Item>
		<DropdownMenu.Item on:click={() => resetMode()} class="text-foreground">System</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
