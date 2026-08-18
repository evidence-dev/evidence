import type { AnyRowType } from '../../../../interfaces/query-service';

export const getRowValue = (
	row: AnyRowType,
	attributeValue: string | number | undefined
): string | number | undefined => {
	if (typeof attributeValue !== 'string') return undefined;
	const value = row[attributeValue];
	if (typeof value === 'undefined' || value === null) return undefined;
	if (typeof value === 'number' || typeof value === 'string') return value;
};
