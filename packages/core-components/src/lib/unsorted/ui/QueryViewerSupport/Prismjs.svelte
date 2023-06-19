<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import './prismtheme.css';
	import { blur } from 'svelte/transition';
	import Prism from 'prismjs';
	import { prism_sql } from './prism-sql';

	export let code = '';
</script>

<pre in:blur>
  <code class="language-sql">{@html Prism.highlight(code, prism_sql)}</code>
</pre>

<style>
	:root {
		--scrollbar-track-color: transparent;
		--scrollbar-color: rgba(0, 0, 0, 0.2);
		--scrollbar-active-color: rgba(0, 0, 0, 0.4);
		--scrollbar-size: 0.75rem;
		--scrollbar-minlength: 1.5rem; /* Minimum length of scrollbar thumb (width of horizontal, height of vertical) */
	}

	pre {
		white-space: normal;
		margin: 0 0 0 0; /* Makes the block jump around on transition */
		display: block;
		scrollbar-width: thin;
		scrollbar-color: var(--scrollbar-color) var(--scrollbar-track-color);
	}

	pre::-webkit-scrollbar {
		height: var(--scrollbar-size);
		width: var(--scrollbar-size);
	}
	pre::-webkit-scrollbar-track {
		background-color: var(--scrollbar-track-color);
	}
	pre::-webkit-scrollbar-thumb {
		background-color: var(--scrollbar-color);
		border-radius: 7px;
		background-clip: padding-box;
	}
	pre::-webkit-scrollbar-thumb:hover {
		background-color: var(--scrollbar-active-color);
	}
	pre::-webkit-scrollbar-thumb:vertical {
		min-height: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	pre::-webkit-scrollbar-thumb:horizontal {
		min-width: var(--scrollbar-minlength);
		border: 3px solid transparent;
	}
	code {
		display: block; /* inline-block has odd behavior when it overflows on webkit mobile */
	}
</style>
