declare module 'sveltekit-autoimport' {
	import { MarkupPreprocessor } from 'svelte/compiler';

	type AutoImportArgs = {
		include?: string[];
		exclude?: string[];
		module?: Record<string, string[]>;
		mapping?: unknown;
		components?: (string | { directory: string; flat?: boolean; prefix?: string })[];
	};

	export default function (args: AutoImportArgs): { markup: MarkupPreprocessor };
}
