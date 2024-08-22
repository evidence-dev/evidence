<script>
	import { Button } from '../../../atoms/shadcn/button';
	import * as DropdownMenu from '../../../atoms/shadcn/dropdown-menu';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { Settings, _3dCubeSphere, Link, Dots, Table, Prompt } from '@steeze-ui/tabler-icons';
	import { showQueries } from '@evidence-dev/component-utilities/stores';
	import { dev } from '$app/environment';

	const beforeprint = new Event('export-beforeprint');
	const afterprint = new Event('export-afterprint');
	function print() {
		window.dispatchEvent(beforeprint);
		setTimeout(() => window.print(), 0);
		setTimeout(() => window.dispatchEvent(afterprint), 0);
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="ghost"
			size="sm"
			class="px-1 text-foreground"
			id="layout-kebab"
		>
			<Icon src={Dots} class="h-6 w-6" />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="w-44 text-xs bg-background border-border">
		<DropdownMenu.Group>
			<DropdownMenu.Item on:click={print} class="text-foreground hover:bg-muted">
				Print PDF
				<DropdownMenu.Shortcut class="text-muted-foreground">⌘P</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Item
				on:click={() => {
					showQueries.update((val) => !val);
				}}
				class="text-foreground hover:bg-muted"
			>
				{$showQueries ? 'Hide ' : 'Show '} Queries
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		{#if dev}
			<DropdownMenu.Separator class="bg-border" />
			<DropdownMenu.Group>
				<DropdownMenu.Item href="/settings" el="a" class="text-foreground hover:bg-muted">
					Settings
					<DropdownMenu.Shortcut
						><Icon src={Settings} class="w-4 h-4 text-muted-foreground" /></DropdownMenu.Shortcut
					>
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/settings/#deploy" el="a" class="text-foreground hover:bg-muted">
					Deploy
					<DropdownMenu.Shortcut
						><Icon
							src={_3dCubeSphere}
							class="h-4 w-4 text-muted-foreground"
						/></DropdownMenu.Shortcut
					>
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/explore/schema" el="a" class="text-foreground hover:bg-muted">
					Schema Viewer
					<DropdownMenu.Shortcut>
						<Icon src={Table} class="h-4 w-4 text-muted-foreground" />
					</DropdownMenu.Shortcut>
				</DropdownMenu.Item>
				<DropdownMenu.Item href="/explore/console" el="a" class="text-foreground hover:bg-muted">
					SQL Console
					<DropdownMenu.Shortcut>
						<Icon src={Prompt} class="h-4 w-4 text-muted-foreground" />
					</DropdownMenu.Shortcut>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					href="https://docs.evidence.dev"
					target="_blank"
					rel="noreferrer"
					el="a"
					class="text-foreground hover:bg-muted"
				>
					Documentation
					<DropdownMenu.Shortcut
						><Icon src={Link} class="h-4 w-4 text-muted-foreground" /></DropdownMenu.Shortcut
					>
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
