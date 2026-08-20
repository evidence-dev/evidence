<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import * as Sidebar from '@evidence/core/shadcn/components/ui/sidebar';
	import * as DropdownMenu from '@evidence/core/shadcn/components/ui/dropdown-menu';
	import * as Avatar from '@evidence/core/shadcn/components/ui/avatar';
	import { Button } from '@evidence/core/shadcn/components/ui/button';
	import { TooltipProvider } from '@evidence/core/shadcn/components/ui/tooltip';
	import PageNavTree from '@evidence/core/viewer-components/PageNavTree.svelte';
	import LanguageMenuItems from '@evidence/core/viewer-components/LanguageMenuItems.svelte';
	import { buildNavTreeFromFlat } from '@evidence/core/utils/nav-tree';
	import { downloadPng } from '@evidence/core/utils/png-download';
	import {
		MoreHorizontal,
		FileText,
		Image as ImageIcon,
		Check,
		ChevronsUpDown,
		SunIcon,
		MoonIcon,
		Fullscreen,
		Minimize,
		User
	} from 'lucide-svelte';
	import { createFullscreen } from '@evidence/core/utils/fullscreen.svelte';
	import { ModeWatcher, mode, toggleMode } from 'mode-watcher';
	import { Toaster, toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { generateThemeCSS } from '@evidence/core/theme/theme-css-helper';
	import { setThemeContext } from '@evidence/core/theme/theme.context.svelte';

	interface Props {
		data: LayoutData;
		children: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	// theme.yaml drives the project theme. Keep the context in sync on dev
	// reloads (invalidateAll re-runs load without remounting the layout).
	const themeContext = setThemeContext(data.resolvedTheme);
	$effect(() => themeContext.updateConfig(data.resolvedTheme));
	const themeCSS = $derived(generateThemeCSS(data.resolvedTheme));

	const isAuthenticated = $derived(!!data.organizationId);
	const isLoginPage = $derived(page.url.pathname === '/login');
	// Local connection.yaml projects query their warehouse directly, so they run
	// without a login — don't force them to the login wall.
	const requiresLogin = $derived(!data.hasLocalConnection);

	// Redirect to login if a login is required but absent (except on login page)
	$effect(() => {
		if (browser && requiresLogin && !isAuthenticated && !isLoginPage) {
			goto('/login');
		}
	});

	// Fullscreen presentation mode (bare content, auto-hiding controls). Shared
	// behaviour with the Studio published/preview viewers.
	const fs = createFullscreen();

	const navTree = $derived(buildNavTreeFromFlat(data.navItems));

	// Dev poll: user content is read at runtime, not in Vite's module graph, so HMR can't see it.
	// Serve mode ships immutable content (restart to refresh), so no poll.
	onMount(() => {
		if (data.isServe) return;
		const interval = setInterval(async () => {
			try {
				const res = await fetch('/api/project-changed');
				if (!res.ok) return;
				const { changed } = await res.json();
				if (changed) invalidateAll();
			} catch {
				// Silently ignore network errors
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	const orgDisplayName = $derived(
		data.organizationName ?? data.organizations?.find((o) => o.id === data.organizationId)?.name
	);

	let switchingOrg = $state<string | null>(null);

	async function handleSwitchOrg(orgId: string) {
		if (orgId === data.organizationId || switchingOrg) return;
		switchingOrg = orgId;
		try {
			const response = await fetch('/api/switch-org', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organizationId: orgId })
			});
			if (response.ok) {
				window.location.reload();
				return;
			}
			toast.error('Could not switch organization');
		} catch {
			toast.error('Could not switch organization');
		} finally {
			switchingOrg = null;
		}
	}

	type SidebarUser = {
		email: string;
		firstName?: string | null;
		lastName?: string | null;
		profilePictureUrl?: string | null;
	};

	function displayName(user: SidebarUser): string {
		if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
		if (user.firstName) return user.firstName;
		return user.email;
	}

	function initials(user: SidebarUser): string {
		if (user.firstName) {
			return (user.firstName[0] + (user.lastName?.[0] ?? '')).toUpperCase();
		}
		return (user.email[0] ?? '?').toUpperCase();
	}

	// Capture the rendered report DOM client-side; mirrors the published kebab.
	function downloadCurrentPng() {
		const slug = page.url.pathname === '/' ? 'home' : page.url.pathname.replace(/^\//, '');
		downloadPng({ filename: slug.replace(/\//g, '-') || 'report' });
	}
</script>

<svelte:head>
	<!-- Project theme (theme.yaml) → CSS variables, scoped to :root like Studio -->
	{@html `<style>${themeCSS}</style>`}
</svelte:head>

<ModeWatcher />
<Toaster />
<svelte:document onmousemove={fs.active ? fs.handleMouseMove : undefined} />

{#if isLoginPage}
	<!-- Login page renders without sidebar -->
	{@render children()}
{:else if fs.active}
	<!-- Fullscreen presentation: bare content, no sidebar/header chrome -->
	<main
		class="bg-background h-svh overflow-auto overflow-x-hidden scroll-smooth"
		class:cursor-none={!fs.showControls}
	>
		{#key page.url.pathname}
			{@render children()}
		{/key}
	</main>
	<button
		class="fixed top-4 right-4 z-50 rounded-full bg-black/30 p-2 text-white transition-opacity hover:bg-black/50 print:hidden {fs.showControls
			? 'opacity-100'
			: 'opacity-0'}"
		onclick={fs.exit}
		title="Exit fullscreen"
	>
		<Minimize class="h-4 w-4" />
	</button>
{:else}
	<TooltipProvider>
		<Sidebar.Provider initialWidthPx={data.sidebarWidthPx} class="h-svh select-none">
			<Sidebar.Root
				variant="sidebar"
				class="**:data-[sidebar=sidebar]:bg-background **:data-[sidebar=sidebar]:border-0 [&>div:not([data-sidebar=sidebar])]:border-r-0"
			>
				<Sidebar.Header class="h-12 justify-center">
					<a href="/" class="flex h-8 items-center gap-2 px-4 font-semibold tracking-tight">
						<p class="text-base font-medium">{orgDisplayName ?? 'Evidence'}</p>
					</a>
				</Sidebar.Header>
				<Sidebar.Content
					class="**:data-[sidebar=menu]:gap-[3px] **:data-[sidebar=menu-button]:h-7! **:data-[sidebar=menu-button]:py-1! gap-1 [&>:first-child]:pt-0"
				>
					<Sidebar.Group class="text-muted-foreground">
						<Sidebar.GroupContent>
							<Sidebar.Menu>
								{#if data.navItems.length === 0}
									<p class="text-muted-foreground px-3 text-sm">No pages found</p>
								{:else}
									<Sidebar.Group>
										{#if data.projectName}
											<Sidebar.MenuItem>
												<Sidebar.MenuButton class="text-muted-foreground font-medium capitalize">
													{#snippet child()}
														<span
															class="text-primary flex h-7 w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1 text-left text-sm font-medium capitalize"
														>
															{data.projectName}
														</span>
													{/snippet}
												</Sidebar.MenuButton>
											</Sidebar.MenuItem>
										{/if}
										<PageNavTree tree={navTree} currentPath={page.url.pathname} />
									</Sidebar.Group>
								{/if}
							</Sidebar.Menu>
						</Sidebar.GroupContent>
					</Sidebar.Group>
				</Sidebar.Content>
				<Sidebar.Footer class="flex flex-col gap-2">
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton
											size="lg"
											{...props}
											class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
										>
											{#if data.user}
												{@const user = data.user}
												<Avatar.Root class="h-8 w-8 rounded-lg">
													<Avatar.Image src={user.profilePictureUrl} alt={displayName(user)} />
													<Avatar.Fallback class="rounded-lg">{initials(user)}</Avatar.Fallback>
												</Avatar.Root>
												<div class="grid flex-1 text-left text-sm leading-tight">
													<span class="truncate font-semibold">{displayName(user)}</span>
													<span class="text-muted-foreground truncate text-xs">{user.email}</span>
												</div>
											{:else}
												<Avatar.Root class="h-8 w-8 rounded-lg">
													<Avatar.Fallback class="bg-muted text-muted-foreground rounded-lg">
														<User class="size-4" />
													</Avatar.Fallback>
												</Avatar.Root>
												<div class="grid flex-1 text-left text-sm leading-tight">
													<span class="text-muted-foreground truncate font-semibold">Not logged in</span>
												</div>
											{/if}
											<ChevronsUpDown class="ml-auto size-4 shrink-0" />
										</Sidebar.MenuButton>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end" side="top" class="w-56">
									{#if data.user}
										{@const user = data.user}
										<DropdownMenu.Label class="p-0 font-normal">
											<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
												<Avatar.Root class="h-8 w-8 rounded-lg">
													<Avatar.Image src={user.profilePictureUrl} alt={displayName(user)} />
													<Avatar.Fallback class="rounded-lg">{initials(user)}</Avatar.Fallback>
												</Avatar.Root>
												<div class="grid flex-1 text-left text-sm leading-tight">
													<span class="truncate font-semibold">{displayName(user)}</span>
													<span class="text-muted-foreground truncate text-xs">{user.email}</span>
												</div>
											</div>
										</DropdownMenu.Label>
										<DropdownMenu.Separator />
									{:else}
										<DropdownMenu.Label class="text-muted-foreground text-xs font-normal">
											To log in, run <code class="bg-muted rounded px-1">evidence login</code>
										</DropdownMenu.Label>
										<DropdownMenu.Separator />
									{/if}

									<DropdownMenu.Item
										class="cursor-pointer"
										onclick={(e) => {
											e.preventDefault();
											toggleMode();
										}}
									>
										{#if mode.current === 'light'}
											<SunIcon class="size-4" />
											Light
										{:else}
											<MoonIcon class="size-4" />
											Dark
										{/if}
									</DropdownMenu.Item>

									{#if data.organizations && data.organizations.length > 1}
										<DropdownMenu.Separator />
										<DropdownMenu.Label class="text-muted-foreground text-xs font-normal"
											>Organizations</DropdownMenu.Label
										>
										{#each [...data.organizations].sort( (a, b) => a.name.localeCompare(b.name) ) as org (org.id)}
											<DropdownMenu.Item
												class="cursor-pointer gap-2 text-sm"
												disabled={switchingOrg !== null}
												onclick={() => handleSwitchOrg(org.id)}
											>
												{#snippet child({ props })}
													<div class="flex w-full items-center gap-2" {...props}>
														<span class="truncate">{org.name}</span>
														{#if org.id === data.organizationId}
															<Check class="ml-auto size-4 shrink-0" />
														{/if}
													</div>
												{/snippet}
											</DropdownMenu.Item>
										{/each}
									{/if}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.Footer>
			</Sidebar.Root>
			<Sidebar.Inset class="flex flex-col">
				<header
					class="bg-background/80 sticky top-0 z-50 flex h-12 w-full items-center justify-between gap-2 border-b pr-2 backdrop-blur-lg print:hidden"
				>
					<div class="flex items-center gap-2 px-4">
						<Sidebar.Trigger class="-ml-1" />
					</div>

					<div class="flex items-center gap-1">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<Button variant="ghost" size="icon" class="h-8 w-8 p-0">
									<MoreHorizontal class="h-4 w-4" />
									<span class="sr-only">Open menu</span>
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end" class="w-56">
								<DropdownMenu.Item class="cursor-pointer text-sm" onclick={() => window.print()}>
									{#snippet child({ props })}
										<div class="flex w-full items-center gap-2" {...props}>
											<FileText class="size-3 shrink-0" />
											<span>Download PDF</span>
										</div>
									{/snippet}
								</DropdownMenu.Item>
								<DropdownMenu.Item class="cursor-pointer text-sm" onclick={downloadCurrentPng}>
									{#snippet child({ props })}
										<div class="flex w-full items-center gap-2" {...props}>
											<ImageIcon class="size-3 shrink-0" />
											<span>Download Image</span>
										</div>
									{/snippet}
								</DropdownMenu.Item>
								<LanguageMenuItems
									languages={data.languages}
									currentLanguage={data.currentLanguage}
								/>
								<DropdownMenu.Item class="cursor-pointer text-sm" onclick={fs.enter}>
									{#snippet child({ props })}
										<div class="flex w-full items-center gap-2" {...props}>
											<Fullscreen class="size-3 shrink-0" />
											<span>Fullscreen</span>
										</div>
									{/snippet}
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</header>
				<div class="report-viewport min-w-0 flex-1 overflow-auto overflow-x-hidden scroll-smooth">
					<!-- Remount page on navigation so that contexts are re-initialized properly -->
					{#key page.url.pathname}
						{@render children()}
					{/key}
				</div>
			</Sidebar.Inset>
		</Sidebar.Provider>
	</TooltipProvider>
{/if}

<style>
	/* "Download PDF" is window.print(); release the viewport clamp so the report paginates */
	@media print {
		main,
		.report-viewport {
			height: auto !important;
			overflow: visible !important;
		}
		:global([data-slot='sidebar-wrapper']) {
			height: auto !important;
		}
		:global([data-slot='sidebar']) {
			display: none !important;
		}
	}
</style>
