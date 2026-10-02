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
		return (
			dir.href === currentPath ||
			dir.pages.some((p) => p.href === currentPath) ||
			(dir.directories ?? []).some(dirHasActivePage)
		);
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

{#snippet chevron(collapsed: boolean)}
	<ChevronRight class="h-3.5 w-3.5 shrink-0 transition-transform {!collapsed ? 'rotate-90' : ''}" />
{/snippet}

{#snippet directory(dir: NavDirectory)}
	{@const collapsed = isDirectoryCollapsed(dir)}
	{@const isActive = dir.href === currentPath}
	<Sidebar.MenuItem>
		<Sidebar.MenuButton {isActive}>
			{#snippet child({ props })}
				{#if dir.href}
					<!-- Folder with its own page: the chevron toggles, the name navigates. -->
					<div {...props}>
						<button
							type="button"
							class="-m-1 cursor-pointer rounded p-1"
							aria-label={collapsed ? `Expand ${dir.name}` : `Collapse ${dir.name}`}
							aria-expanded={!collapsed}
							onclick={() => toggleDirectory(dir)}
						>
							{@render chevron(collapsed)}
						</button>
						<a href={dir.href} class="flex min-w-0 flex-1 items-center gap-2">
							{@render pageIcon({ name: dir.name, href: dir.href, icon: dir.icon }, isActive)}
							<Ellipsis class="w-full cursor-pointer">
								{dir.name}
							</Ellipsis>
						</a>
					</div>
				{:else}
					<button
						type="button"
						{...props}
						aria-expanded={!collapsed}
						onclick={() => toggleDirectory(dir)}
					>
						{@render chevron(collapsed)}
						<Ellipsis class="w-full cursor-pointer">
							{dir.name}
						</Ellipsis>
					</button>
				{/if}
			{/snippet}
		</Sidebar.MenuButton>

		{#if !collapsed}
			<!-- Indent children so the guide line runs under the chevron's centre and a
			     child row starts under this folder's name (8px pad + 14px chevron + 8px
			     gap = 30px = 14 margin + 1 border + 7 pad + 8 row pad): a sub-folder's
			     chevron sits there, and a page adds a chevron-width spacer. -->
			<div class="my-1 ml-3.5 border-l pl-[7px]">
				{#each dir.pages as navPage (navPage.href)}
					{@const isActive = navPage.href === currentPath}
					<Sidebar.MenuButton {isActive}>
						{#snippet child({ props })}
							<a href={navPage.href} {...props}>
								<!-- Chevron-width spacer: pages sit one step right of their folder's name. -->
								<span class="w-3.5 shrink-0" aria-hidden="true"></span>
								{@render pageIcon(navPage, isActive)}
								<Ellipsis class="w-full cursor-pointer">
									{navPage.name}
								</Ellipsis>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				{/each}
				{#if dir.directories?.length}
					<Sidebar.Menu>
						{#each dir.directories as subdir (subdir.id)}
							{@render directory(subdir)}
						{/each}
					</Sidebar.Menu>
				{/if}
			</div>
		{/if}
	</Sidebar.MenuItem>
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

	<!-- Directories, their pages and sub-directories -->
	{#each tree.directories as dir (dir.id)}
		{@render directory(dir)}
	{/each}
</Sidebar.Menu>
