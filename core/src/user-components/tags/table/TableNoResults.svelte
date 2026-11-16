<script lang="ts">
	import { getLocaleContext } from '../../../locale/locale.context.svelte';

	const { t } = getLocaleContext();
</script>

<tbody>
	<tr class="h-full">
		<td colspan="100" class="h-full text-center align-middle">
			<div class="flex h-full min-h-[200px] items-center justify-center">
				<div class="text-muted-foreground">
					<div class="text-sm">{t('table.no_results')}</div>
				</div>
			</div>
		</td>
	</tr>
</tbody>
