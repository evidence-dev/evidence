<script lang="ts">
	import * as Sidebar from '../shadcn/components/ui/sidebar';
	import { ChevronRight } from 'lucide-svelte';
	import Ellipsis from './Ellipsis.svelte';
	import { loadLucideIcon } from '../user-components/common/dynamic-icon';
	import { type NavTree, type NavDirectory, type NavPage } from '../utils/nav-tree';

	let { tree, currentPath }: { tree: NavTree; currentPath: string } = $props();

	// Per-directory collapse state. Default: expanded when it contains the
	// active page, collapsed otherwise. Once the user toggles a directory we
	// honour their explicit choice (mirrors the published viewer).
	let collapsedDirectories = $state<Record<string, boolean>>({});

	function dirHasActivePage(dir: NavDirectory): boolean {
		return dir.pages.some((p) => p.href === currentPath);
	}

	function isDirectoryCollapsed(dir: NavDirectory): boolean {
		if (collapsedDirectories[dir.id] === undefined) {
			return !dirHasActivePage(dir);
		}
		return collapsedDirectories[dir.id];
	}

	function toggleDirectory(dir: NavDirectory) {
		collapsedDirectories = {
			...collapsedDirectories,
			[dir.id]: !isDirectoryCollapsed(dir)
		};
	}
</script>

{#snippet pageIcon(navPage: NavPage, isActive: boolean)}
	{@const tone = isActive ? 'text-primary' : 'text-muted-foreground/80'}
	{#if navPage.icon}
		{@const IconComponent = loadLucideIcon(navPage.icon)}
		{#if IconComponent}
			<IconComponent class="h-4 w-4 {tone}" />
		{/if}
	{/if}
{/snippet}

<Sidebar.Menu>
	<!-- Root pages -->
	{#each tree.rootPages as navPage (navPage.href)}
		{@const isActive = navPage.href === currentPath}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton {isActive}>
				{#snippet child({ props })}
					<a href={navPage.href} {...props}>
						{@render pageIcon(navPage, isActive)}
						<Ellipsis class="w-full cursor-pointer">
							{navPage.name}
						</Ellipsis>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/each}

	<!-- Directories and their pages -->
	{#each tree.directories as dir (dir.id)}
		{@const collapsed = isDirectoryCollapsed(dir)}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton>
				{#snippet child({ props })}
					<button type="button" {...props} onclick={() => toggleDirectory(dir)}>
						<ChevronRight
							class="h-3.5 w-3.5 shrink-0 transition-transform {!collapsed ? 'rotate-90' : ''}"
						/>
						<Ellipsis class="w-full cursor-pointer">
							{dir.name}
						</Ellipsis>
					</button>
				{/snippet}
			</Sidebar.MenuButton>

			{#if !collapsed}
				<div class="my-1 border-l pl-1">
					{#each dir.pages as navPage (navPage.href)}
						{@const isActive = navPage.href === currentPath}
						<Sidebar.MenuButton {isActive}>
							{#snippet child({ props })}
								<a href={navPage.href} {...props}>
									{@render pageIcon(navPage, isActive)}
									<Ellipsis class="w-full cursor-pointer">
										{navPage.name}
									</Ellipsis>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					{/each}
				</div>
			{/if}
		</Sidebar.MenuItem>
	{/each}
</Sidebar.Menu>
