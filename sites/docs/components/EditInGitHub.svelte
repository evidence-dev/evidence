<script>
	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	const repoUrl = 'https://github.com/evidence-dev/evidence/edit/next/sites/docs/pages/';

	const filePath = derived(page, ($page) => {
		return $page.url.pathname.replace(/^\//, '').replace(/\/$/, '') + '/index.md';
	});

	const editUrl = derived(filePath, ($filePath) => `${repoUrl}${$filePath}`);
</script>

<div class="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-row pb-4">
	<div class="text-base-content-muted text-sm md:ml-48 md:pl-8">
		<a href={$editUrl} target="_blank" rel="noopener noreferrer" class="hover:underline">
			<span class="inline-flex items-center">Edit page on GitHub</span>
		</a>
	</div>
</div>
