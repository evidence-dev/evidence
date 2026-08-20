<script lang="ts">
	import type { EChartsOption } from 'echarts';
	import * as Accordion from '../../../shadcn/components/ui/accordion';
	import Button from '../../../shadcn/components/ui/button/button.svelte';
	import { Copy, Check, ExternalLink, BugIcon } from 'lucide-svelte';
	import { deflateRaw } from 'pako';
	import { getRendererContext } from '../../Renderer/renderer-context';
	import { getDebugModeContext } from '../../../debug-mode.context.svelte';
	import { logger } from '../../../shims/logger';

	let { options }: { options: EChartsOption } = $props();

	// Only show debug config in edit mode when debug mode is enabled
	const rendererContext = getRendererContext();
	const debugModeContext = getDebugModeContext();
	const shouldShow = $derived(
		rendererContext.context === 'edit' && debugModeContext?.enabled === true
	);

	const formattedConfig = $derived(JSON.stringify(options, null, 2));
	const fullCode = $derived(`option=${formattedConfig}`);

	function encodeEChartsURLCode(code: string): string {
		const compressed = deflateRaw(code);
		const encoded = btoa(String.fromCharCode(...new Uint8Array(compressed)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
		return encoded;
	}

	const echartsEditorUrl = $derived.by(() => {
		try {
			const encoded = encodeEChartsURLCode(fullCode);
			return `https://echarts.apache.org/examples/en/editor.html?code=${encoded}&enc=deflate`;
		} catch (err) {
			logger.error(err, 'Failed to encode ECharts config');
			return 'https://echarts.apache.org/examples/en/editor.html';
		}
	});

	let isCopied = $state(false);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(fullCode);
			isCopied = true;
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (err) {
			logger.error(err, 'Failed to copy');
		}
	}
</script>

{#if shouldShow}
	<Accordion.Root type="single" class="bg-muted my-2 rounded-xs border *:font-mono">
		<Accordion.Item value="debug-config">
			<Accordion.Trigger class="text-muted-foreground flex items-center justify-between px-2 py-1">
				<span class="flex items-center gap-2">
					<BugIcon class="size-4" />
					ECharts Configuration
				</span>
			</Accordion.Trigger>
			<Accordion.Content class="border-t p-0 text-left">
				<div class="relative">
					<div class="absolute top-0 right-0 z-10 flex items-center gap-2">
						<a
							href={echartsEditorUrl}
							target="_blank"
							rel="noopener noreferrer"
							class=" flex items-center gap-1 rounded bg-transparent text-xs"
							title="Open in ECharts Editor"
						>
							<ExternalLink class="h-4 w-4" />
						</a>
						<Button
							variant="ghost"
							class=" flex items-center gap-1 rounded bg-transparent text-xs"
							onclick={copyToClipboard}
							title="Copy code to clipboard"
						>
							{#if isCopied}
								<Check class="h-4 w-4 text-green-600" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</Button>
					</div>
					<div>
						<pre
							class="text-primary m-0 max-h-[400px] overflow-y-auto bg-transparent p-2 font-mono text-xs">option={formattedConfig}</pre>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}
