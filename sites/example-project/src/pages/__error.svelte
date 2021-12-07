<script context="module">
	/** @type {import('@sveltejs/kit').ErrorLoad} */
	export function load({ error, status }) {
		return {
			props: {
				title: `${error.message}`
			}
		};
	}
</script>

<script>
	export let title;
</script>

<h2>{title}</h2>