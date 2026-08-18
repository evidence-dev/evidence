import type { UserComponent } from '../../types';
import Download from './Download.svelte';
import { schema } from './schema';
import { DownloadModel } from './DownloadModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Download,
	Model: DownloadModel
};
