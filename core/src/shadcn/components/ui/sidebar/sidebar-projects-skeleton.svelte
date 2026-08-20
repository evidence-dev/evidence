<script lang="ts">
	import Skeleton from '../../../../shadcn/components/ui/skeleton/skeleton.svelte';
	import * as Sidebar from '../../../../shadcn/components/ui/sidebar/index.js';
</script>

{#snippet projectSkeleton(opacity: number, isFirst: boolean = false)}
	<Sidebar.Group style="opacity: {opacity}">
		<Sidebar.MenuItem>
			<!-- Project name skeleton - matches h-8 of actual project name -->
			<div class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
				<Skeleton class="{isFirst ? 'bg-primary/10' : ''} h-4 w-[160px] rounded-md" />
			</div>
		</Sidebar.MenuItem>
		<Sidebar.Menu>
			<!-- Page skeletons -->
			<Sidebar.MenuItem>
				<div class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
					<Skeleton class="h-4 w-[140px] rounded-md" />
				</div>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<div class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
					<Skeleton class="h-4 w-[120px] rounded-md" />
				</div>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<div class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2">
					<Skeleton class="h-4 w-[150px] rounded-md" />
				</div>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Group>
{/snippet}

{@render projectSkeleton(1, true)}
{@render projectSkeleton(0.7)}
{@render projectSkeleton(0.5)}
{@render projectSkeleton(0.3)}
