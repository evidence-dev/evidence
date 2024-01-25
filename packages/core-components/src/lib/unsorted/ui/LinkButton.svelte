<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let url;
</script>

<a
	href={url}
	class="font-ui font-normal text-base no-underline border mt-5 rounded-lg py-2 px-3 inline-block transition hover:ease-in hover:border-primary-200 hover:bg-primary-100 hover:no-underline hover:text-gray-800 focus:text-gray-900 focus:border-primary-200"
>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>
