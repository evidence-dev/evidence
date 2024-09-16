<script>
	import Button from '../../../atoms/shadcn/button/button.svelte';
	import * as DropdownMenu from '../../../atoms/shadcn/dropdown-menu';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Palette } from '@steeze-ui/tabler-icons';
	import ThemeChanger from '../../../molecules/theme-changer/ThemeChanger.svelte';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button builders={[builder]} variant="ghost" size="sm">
			<Icon src={Palette} class="h-6 w-6" />
		</Button>
	</DropdownMenu.Trigger>

	<DropdownMenu.Content>
		<ThemeChanger />
	</DropdownMenu.Content>
</DropdownMenu.Root>
