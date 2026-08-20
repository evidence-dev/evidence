import type { UserComponent } from '../../types';
import Table from './Table.svelte';
import { TableModel } from './TableModel.svelte';
import { schema } from './schema';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: Table,
	Model: TableModel
};
