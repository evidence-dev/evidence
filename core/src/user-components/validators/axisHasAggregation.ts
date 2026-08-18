import { isValidationContext, type Validator, getTableFromContext, stripTypeCast } from './types';
import { hasAgg } from '../common/sql-expression-utils';
import { logger } from '../../shims/logger';

/**
 * Check if at least one of the x or y attributes contains aggregation functions
 * Returns a warning if no aggregation is detected and suggests the appropriate axis
 */
export const axisHasAggregation =
	(
		xAttribute: string = 'x',
		yAttribute: string = 'y',
		{ getXFromParent }: { getXFromParent?: boolean } = {}
	): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		let xValue: unknown;
		if (getXFromParent) {
			if (!node.parent) {
				logger.error(
					{
						xAttribute
					},
					`Failed to find parent of ${node.tag} when checking axis aggregation`
				);
				return [];
			}
			xValue = node.parent.attributes[xAttribute];
		} else {
			xValue = node.attributes[xAttribute];
		}

		const yValue = node.attributes[yAttribute];

		if (!xValue || typeof xValue !== 'string' || !yValue || typeof yValue !== 'string') {
			return [];
		}

		// If either axis has aggregation, we're good
		if (hasAgg(xValue) || hasAgg(yValue)) {
			return [];
		}

		// Default message
		// Suggest aggregating the Y value only — without metadata we can't know
		// column types, and suggesting sum(<categorical x>) reads as nonsense
		// (GA dry-run feedback: "sum(category)" eroded trust in the warning).
		const defaultMessage = `Consider using an aggregation function on the numeric axis — e.g. sum(${yValue}) or avg(${yValue}). Raw column values may not aggregate properly across groups. If the query already returns one pre-aggregated row per ${xValue}, this is safe to ignore.`;

		// Try to get specific guidance from metadata
		const table = node.attributes.data;
		const tableMetadata = table && typeof table === 'string' && getTableFromContext(table, context);

		if (tableMetadata) {
			const xColumn = tableMetadata.getColumn(stripTypeCast(xValue));
			const yColumn = tableMetadata.getColumn(stripTypeCast(yValue));
			const xIsNumeric = xColumn?.jsType === 'number';
			const yIsNumeric = yColumn?.jsType === 'number';

			// Provide specific guidance based on column types
			if (yIsNumeric && !xIsNumeric) {
				return [
					{
						id: 'axes-missing-aggregation',
						level: 'warning' as const,
						message: `${yAttribute}: Consider using an aggregation function like sum(${yValue}) or avg(${yValue}). Raw column values may not aggregate properly across groups.`,
						location: node.location
					}
				];
			}

			if (xIsNumeric && !yIsNumeric) {
				return [
					{
						id: 'axes-missing-aggregation',
						level: 'warning' as const,
						message: `${xAttribute}: Consider using an aggregation function like sum(${xValue}) or avg(${xValue}). Raw column values may not aggregate properly across groups.`,
						location: node.location
					}
				];
			}

			if (xIsNumeric && yIsNumeric) {
				return [
					{
						id: 'axes-missing-aggregation',
						level: 'warning' as const,
						message: `${yAttribute}: Consider using an aggregation function like sum(${yValue}) or avg(${yValue}). Raw column values may not aggregate properly across groups.`,
						location: node.location
					}
				];
			}
		}

		// Fallback to generic message
		return [
			{
				id: 'axes-missing-aggregation',
				level: 'warning' as const,
				message: defaultMessage,
				location: node.location
			}
		];
	};
