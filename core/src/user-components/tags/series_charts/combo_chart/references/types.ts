import type { ReferenceAreaStaticModel } from './reference_area/ReferenceAreaStaticModel.svelte';
import type { ReferenceLineStaticModel } from './reference_line/ReferenceLineStaticModel.svelte';
import type { ReferencePointStaticModel } from './reference_point/ReferencePointStaticModel.svelte';

export type ReferenceModel =
	| ReferenceLineStaticModel
	| ReferenceAreaStaticModel
	| ReferencePointStaticModel;
