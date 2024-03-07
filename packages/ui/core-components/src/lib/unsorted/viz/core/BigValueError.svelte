<script context="module">
	export const evidenceInclude = true;
</script>

<script>
	export let error;
</script>

<div
	width="100%"
	class="inline-block group w-[100px] relative cursor-help cursor-helpfont-sans box-content grid-cols-1 justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-200 h-[38px] mt-0.5 py-3 px-3 print:break-inside-avoid"
>
	<div class="font-bold text-center text-sm">Big Value</div>
	<div class="m-auto w-[100px]">
		<div class="text-center [word-wrap:break-work] w-full font-medium text-xs text-red-600">
			error
			<span
				class="hidden text-white font-sans group-hover:inline-block absolute top-[50%] left-[50%] text-sm z-10 px-2 py-1 bg-gray-800/80 leading-relaxed min-w-[150px] max-w-[400px] rounded-md z-50 overflow-visible"
			>
				{error}
			</span>
		</div>
	</div>
</div>
