<script>
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';

	export let folder;
	let open;

	let expanded = false;

	function toggle() {
		expanded = !expanded;
		// if ($page.url.pathname.split('/')[1] != folder.href) {
		// 		expanded = true;
		// 		open = !open;
		// 	} else {
		// }
	}
</script>

<div>
	<a
		on:click={toggle}
		class="hover:bg-gray-50 hover:text-blue-600 cursor-pointer flex items-center w-full text-left rounded-md p-2 gap-x-3 text-sm leading-6 text-gray-700 capitalize "
		aria-controls="sub-menu-1"
		aria-expanded={expanded}
		href={folder.href}
	>
		{folder.label}
		<svg
			class="text-gray-400 ml-auto h-5 w-5 shrink-0 transition-transform duration-200"
			viewBox="0 0 20 20"
			fill="currentColor"
			aria-hidden="true"
			class:rotate-90={expanded}
		>
			<path
				fill-rule="evenodd"
				d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
				clip-rule="evenodd"
			/>
		</svg>
	</a>
	<!-- Expandable link section, show/hide based on state. -->
	{#if expanded}
		<ul class="mt-1 px-2" id="sub-menu-1" transition:slide|local={{duration:200}}>
			{#each folder.children as child}
			<li>
				<!-- 44px -->
				<a
					href={child.href}
					class="hover:bg-gray-50  hover:text-blue-600 block rounded-md py-2 pr-2 pl-6 text-sm leading-6 text-gray-700 capitalize"
					>{child.label}</a
				>
			</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- <div class="collapsible">
	<div
		class="folder"
		class:selected={$page.url.pathname === folder.href}
		class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
	>
		<button
			class="expandable"
			aria-label="expand-menu-button"
			aria-expanded={expanded}
			on:click={() => (expanded = !expanded)}
		>
			<svg
				class="collapse-icon"
				class:selected={$page.url.pathname === folder.href}
				class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				style="tran"
				width="9"
				height="9"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="3"
				viewBox="0 0 24 24"
			>
				<path d="M9 5l7 7-7 7" /></svg
			>
		</button>
		{#if folder.href}
			<a href={folder.href} aria-expanded={expanded} on:click={toggle}>
				<div
					class="folder-label"
					class:selected={$page.url.pathname === folder.href}
					class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				>
					{folder.label}
				</div>
			</a>
		{:else}
			<button
				class="folder-label nolink"
				class:folder-selected={'/' + $page.url.pathname.split('/')[1] === folder.href}
				aria-expanded={expanded}
				on:click={() => (expanded = !expanded)}
			>
				{folder.label}
			</button>
		{/if}
	</div>

	{#if expanded}
		<div hidden={!expanded} transition:slide>
			{#each folder.children as child}
				{#if child.href && child.label}
					<a href={child.href} on:click={toggle}>
						<div class:selected={$page.url.pathname === child.href} class="content-item">
							{child.label}
						</div>
					</a>
				{/if}
			{/each}
		</div>
	{/if}
</div> -->
