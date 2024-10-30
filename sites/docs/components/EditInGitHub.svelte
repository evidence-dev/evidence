<script>
    import { page } from '$app/stores';
    import { derived } from 'svelte/store';
    import { Icon } from '@steeze-ui/svelte-icon';
	import { Pencil } from '@steeze-ui/tabler-icons';

    // Base URL for the GitHub repository
    const repoUrl = 'https://github.com/evidence-dev/evidence/edit/next/sites/docs/pages/';

        // Derive the file path from the current page route
        const filePath = derived(page, $page => {
            // Assuming the route matches the file structure
            return $page.url.pathname.replace(/^\//, '').replace(/\/$/, '') + '/index.md'; // Adjust the extension as needed
        });

    // Construct the full GitHub edit URL
    const editUrl = derived(filePath, $filePath => `${repoUrl}${$filePath}`);
</script>

<div class="max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-row pb-4">
    <div class="text-gray-700 text-sm md:ml-48 md:pl-8">
        <a href={$editUrl} target="_blank" rel="noopener noreferrer" class="hover:underline">
            <span class="inline-flex items-center">
            <Icon src={Pencil} class="w-4 h-4 mb-1 mr-1" />
            Edit page on GitHub
            </span>
        </a>
    </div>
</div>
