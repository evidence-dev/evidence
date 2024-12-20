<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import { toBoolean } from '../../utils.js';

	export let url = '#'; // Destination URL
	export let label = 'Click here'; // Link text
	export let newTab = false; // Open in a new tab
	newTab = toBoolean(newTab);
	export let className = ''; // Additional classes
</script>

<a
	href={url}
	target={newTab ? '_blank' : '_self'}
	rel={newTab ? 'noopener noreferrer' : undefined}
	class={className}
>
	{label}
</a>
