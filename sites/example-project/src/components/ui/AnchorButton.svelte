<script>
	export let href;
</script>

<a
	{href}
	class="font-ui font-normal text-base no-underline border mt-5 rounded-lg py-2 px-3 inline-block hover:border-blue-200 hover:bg-blue-100 hover:no-underline hover:text-gray-800 focus:text-gray-900 focus:border-blue-200"
>
	<div>
		<span>
			<slot />
		</span>
	</div>
</a>
