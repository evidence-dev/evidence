<script lang="ts">
	import Ellipsis from '../Ellipsis.svelte';
	import CollapseChevron from './CollapseChevron.svelte';
	import { folderRowClass, navItemClass } from './nav-classes';
	import { loadLucideIcon } from '../../user-components/common/dynamic-icon';
	import { cn } from '../../shadcn/utils';
	import { type NavTree, type NavDirectory, type NavPage } from '../../utils/nav-tree';

	let { tree, currentPath }: { tree: NavTree; currentPath: string } = $props();

	// Folders open around the active page until the user toggles them (matches the published viewer).
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

{#snippet pageLink(navPage: NavPage)}
	{@const isActive = navPage.href === currentPath}
	{@const Icon = navPage.icon ? loadLucideIcon(navPage.icon) : null}
	<li>
		<a
			href={navPage.href}
			aria-current={isActive ? 'page' : undefined}
			class={navItemClass(isActive)}
		>
			{#if Icon}
				<Icon
					class={cn(
						'size-[15px] shrink-0',
						isActive ? 'text-foreground' : 'text-muted-foreground/80'
					)}
					strokeWidth={1.6}
				/>
			{/if}
			<Ellipsis class="w-full cursor-pointer" tooltipSide="right" tooltipSideOffset={-100}>
				{navPage.name}
			</Ellipsis>
		</a>
	</li>
{/snippet}

<ul>
	{#each tree.rootPages as navPage (navPage.href)}
		{@render pageLink(navPage)}
	{/each}

	{#each tree.directories as dir (dir.id)}
		{@const collapsed = isDirectoryCollapsed(dir)}
		<li>
			<button
				type="button"
				class={folderRowClass()}
				aria-expanded={!collapsed}
				onclick={() => toggleDirectory(dir)}
			>
				<Ellipsis class="min-w-0 cursor-pointer" tooltipSide="right" tooltipSideOffset={-100}>
					{dir.name}
				</Ellipsis>
				<CollapseChevron expanded={!collapsed} />
			</button>
			<div
				class={cn(
					'grid grid-cols-1 transition-[grid-template-rows] duration-200 ease-out',
					collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
				)}
			>
				<div class="min-h-0 overflow-clip" inert={collapsed}>
					<ul class="pl-3">
						{#each dir.pages as navPage (navPage.href)}
							{@render pageLink(navPage)}
						{/each}
					</ul>
				</div>
			</div>
		</li>
	{/each}
</ul>
