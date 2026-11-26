import type { UserComponent } from '../../types';
import BigValue from './BigValue.svelte';
import { schema } from './schema';
import { BigValueModel } from './BigValueModel.svelte';
import { bigValueSql } from './sql';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: BigValue,
	Model: BigValueModel,
	sql: bigValueSql
};
