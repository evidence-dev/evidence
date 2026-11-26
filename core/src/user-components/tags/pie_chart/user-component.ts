import type { UserComponent } from '../../types';
import PieChart from './PieChart.svelte';
import { schema } from './schema';
import { pieChartSql } from './sql';

export const userComponent: UserComponent<typeof schema> = {
	schema,
	Component: PieChart,
	sql: pieChartSql
};
