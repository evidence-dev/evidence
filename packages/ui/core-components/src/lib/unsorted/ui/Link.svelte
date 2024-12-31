<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { cn } from '$lib/utils.js';
	import { toBoolean } from '../../utils.js';

	let className = undefined;
	export { className as class };

	export let url = '#'; // Destination URL
	export let label = 'Click here'; // Link text
	export let newTab = false; // Open in a new tab
	newTab = toBoolean(newTab);
</script>

<a
	href={url}
	target={newTab ? '_blank' : '_self'}
	rel={newTab ? 'noopener noreferrer' : undefined}
	class={cn('markdown', className)}
>
	{label}
</a>
