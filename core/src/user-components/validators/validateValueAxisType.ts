import { hasAgg } from '../common/sql-expression-utils';
import { extractColumnReferences } from './validateSqlExpression';
import {
	containsVariableSyntax,
	getTableFromContext,
	isValidationContext,
	stripTypeCast,
	resolveDialect,
	type Validator
} from './types';

type ValidateValueAxisTypeOptions = {
	dataAttribute?: string;
	categoryAxisAttribute?: string;
	swappedAxesChartSuggestion?: string;
};

/**
 * Validates that a chart value axis resolves to numeric values.
 * This catches common axis mixups like using a category column on the value axis.
 */
export const validateValueAxisType =
	(
		valueAxisAttribute: string,
		{
			dataAttribute = 'data',
			categoryAxisAttribute,
			swappedAxesChartSuggestion
		}: ValidateValueAxisTypeOptions = {}
	): Validator =>
	(node, _config, context) => {
		if (!isValidationContext(context)) return [];

		const dialect = resolveDialect(context);
		const valueAxisExpression = node.attributes[valueAxisAttribute];
		const data = node.attributes[dataAttribute];

		if (
			typeof valueAxisExpression !== 'string' ||
			typeof data !== 'string' ||
			containsVariableSyntax(valueAxisExpression)
		) {
			return [];
		}

		// Aggregated expressions are expected to be numeric and already validated elsewhere.
		if (hasAgg(valueAxisExpression, dialect)) {
			return [];
		}

		const table = getTableFromContext(data, context);
		if (!table) {
			return [];
		}

		const valueAxisColumns = extractColumnReferences(valueAxisExpression);
		if (valueAxisColumns.length !== 1) {
			return [];
		}

		// Only validate simple column references (optionally with type casts).
		// Complex expressions may still be numeric, and we don't infer expression return types here.
		const valueAxisExpressionWithoutCast = stripTypeCast(valueAxisExpression).trim();
		const normalizedValueAxisExpression = valueAxisExpressionWithoutCast
			.replace(/^"([^"]+)"$/, '$1')
			.replace(/^`([^`]+)`$/, '$1');
		if (normalizedValueAxisExpression !== valueAxisColumns[0]) {
			return [];
		}

		const valueAxisColumnName = stripTypeCast(valueAxisColumns[0]);
		const valueAxisColumn = table.getColumn(valueAxisColumnName);
		if (
			!valueAxisColumn?.jsType ||
			valueAxisColumn.jsType === 'number' ||
			valueAxisColumn.jsType === 'unknown'
		) {
			return [];
		}

		let swappedAxesHint = '';
		if (categoryAxisAttribute) {
			const categoryAxisExpression = node.attributes[categoryAxisAttribute];
			if (
				typeof categoryAxisExpression === 'string' &&
				!containsVariableSyntax(categoryAxisExpression) &&
				!hasAgg(categoryAxisExpression, dialect)
			) {
				const categoryAxisColumns = extractColumnReferences(categoryAxisExpression);
				if (categoryAxisColumns.length === 1) {
					const categoryAxisColumnName = stripTypeCast(categoryAxisColumns[0]);
					const categoryAxisColumn = table.getColumn(categoryAxisColumnName);
					if (categoryAxisColumn?.jsType === 'number') {
						const suggestion = swappedAxesChartSuggestion
							? ` Consider using \`${swappedAxesChartSuggestion}\` or swapping your x/y axes.`
							: ' Consider swapping your x/y axes.';
						swappedAxesHint = ` It looks like the axes are reversed.${suggestion}`;
					}
				}
			}
		}

		return [
			{
				id: 'invalid-value-axis-type',
				level: 'error' as const,
				message: `${valueAxisAttribute}: "${valueAxisExpression}" must resolve to a numeric value. Found type: ${valueAxisColumn.jsType}.${swappedAxesHint}`,
				location: node.location
			}
		];
	};
