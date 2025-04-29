<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	import './prismtheme.css';
	import Prism from 'prismjs';
	import { prism_sql } from './prism-sql';

	export let code = '';
</script>

<pre class="text-xs max-h-56 overflow-auto pretty-scrollbar"><code class="language-sql"
		>{@html Prism.highlight(code, prism_sql)}
</code></pre>

<style>
	code {
		display: block; /* inline-block has odd behavior when it overflows on webkit mobile */
	}
</style>
