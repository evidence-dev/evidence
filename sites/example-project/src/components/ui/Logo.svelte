<script>
	import { base } from '$app/paths';
	export let organization = 'evidence.dev';
</script>

<a href="{base}/">{organization}</a>

<style>
	a {
		background: -webkit-linear-gradient(315deg, #046ade 0%, #08a86d 75%);
		text-decoration: none;
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		font-size: 1em;
		font-weight: bold;
		font-family: var(--ui-font-family);
	}
</style>
