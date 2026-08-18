<script lang="ts">
	import { userControlledButtonVariants } from '../../common/userControlledButtonVariant';
	import Download from 'lucide-svelte/icons/download';

	import LoaderCircle from 'lucide-svelte/icons/loader-circle';
	import type { UserComponentProps } from '../../types';
	import { schema } from './schema';
	import { getComponentWrapperContext } from '../../common/component-wrapper-context';
	import { downloadAsExcel } from '../../../shims/data-export';
	import { DownloadModel } from './DownloadModel.svelte';
	import { getModelContext } from '../../model-context.svelte';
	import { browser } from '../../../shims/env';
	import { cn } from '../../../shadcn/utils';
	import { logger } from '../../../shims/logger';

	type Props = UserComponentProps<typeof schema>;

	const { setError } = getComponentWrapperContext();
	const props: Props = $props();

	const model = getModelContext({ expected: DownloadModel });

	const label = $derived(model.resolvedLabel);
	const filename = $derived(model.resolvedFilename);
	const variant = $derived(props.variant ?? 'default');

	let loading = $state(false);
	let error = $state<string | undefined>(undefined);

	// Download data as Excel
	async function handleDownload() {
		if (!browser || loading) return;

		loading = true;
		error = undefined;
		setError(undefined);

		try {
			// Fetch data directly when button is clicked
			const result = await model.fetchData();

			if (!result.rows || result.rows.length === 0) {
				error = 'No data available to download';
				setError(error);
				return;
			}

			await downloadAsExcel({
				filename,
				data: result.rows,
				columns: result.columns
			});
		} catch (err) {
			logger.error(err, 'Error downloading Excel file');
			error = err instanceof Error ? err.message : 'Failed to download data';
			setError(error);
		} finally {
			loading = false;
		}
	}
</script>

<button
	type="button"
	onclick={handleDownload}
	disabled={loading}
	class={cn('relative', userControlledButtonVariants({ variant, size: 'sm' }))}
>
	{#if loading}
		<LoaderCircle
			class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 animate-spin [animation-duration:1s]"
		/>
	{:else}
		<Download class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
	{/if}
	<span class="pl-6">{label}</span>
</button>
