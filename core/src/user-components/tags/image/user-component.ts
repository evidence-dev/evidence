import type { UserComponent } from '../../types';
import Image from './Image.svelte';
import { schema } from './schema';
import { ImageModel } from './ImageModel.svelte';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Image,
	Model: ImageModel
};
