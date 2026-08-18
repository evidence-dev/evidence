import { logger } from '../../shims/logger';
import { isValidationContext, type Validator, getTableFromContext, stripTypeCast } from './types';
import {
	defaultDialect,
	type DialectFunctionTypeRule,
	type DialectJsType,
	type SqlDialect
} from '../../sql-dialect';

/**
 * SQL Clause types supported by the validator
 */
export type SqlClauseType = 'select' | 'where' | 'having' | 'order' | 'qualify';

/**
 * Information about a function call extracted from SQL
 */
type FunctionCall = {
	name: string;
	args: string;
	possiblyAggregation: boolean;
};

/**
 * Column type incompatibility details
 */
type TypeIncompatibility = {
	functionName: string;
	columnName: string;
	expectedType: string;
	actualType: string;
};

/**
 * Parsed SQL expression components
 */
type ParsedSql = {
	columns: string[];
	functionCalls: FunctionCall[];
};

/**
 * Table-like object that can provide column information
 */
type TableLike = {
	getColumn: (name: string) =>
		| { type?: string; jsType?: DialectJsType | 'unknown' }
		| undefined;
};

/**
 * Preprocess SQL containing filter variables for validation
 * Uses the centralized VariableProcessor for consistent behavior
 */
function preprocessFilterVariablesForValidation(sql: string): string {
	const filterVariablePattern = /\{\{([^}]+)\}\}/g;

	const processedSql = sql.replace(filterVariablePattern, (match, content) => {
		if (content.trim().startsWith('$')) {
			return '__FRONTMATTER_VAR__';
		}
		const trimmed = content.trim();

		// Parse fallback syntax: "filterId.property | fallback"
		const pipeIndex = trimmed.lastIndexOf('|');
		const filterPart = pipeIndex === -1 ? trimmed : trimmed.substring(0, pipeIndex).trim();
		const fallbackPart = pipeIndex === -1 ? undefined : trimmed.substring(pipeIndex + 1).trim();

		// Determine placeholder based on property type
		if (filterPart.endsWith('.selected')) {
			return fallbackPart ? `'${fallbackPart}'` : `'__FILTER_VAR__'`;
		} else if (filterPart.endsWith('.literal')) {
			return fallbackPart ? `'${fallbackPart}'` : `'__FILTER_VAR__'`;
		} else if (filterPart.endsWith('.filter')) {
			return fallbackPart || `1=1`;
		} else {
			return fallbackPart ? `'${fallbackPart}'` : `'__FILTER_VAR__'`;
		}
	});

	return processedSql;
}

/**
 * Generic SQL expression validator
 *
 * Validates SQL expressions for different clause types (SELECT, WHERE, HAVING, ORDER BY)
 * Supports both single string expressions and arrays of expressions
 *
 * @param sqlExprAttributePath Path to the attribute containing the SQL expression
 * @param tableNameAttribute Name of the attribute containing the table name
 * @param clauseType Type of SQL clause being validated
 */
export function validateSqlExpression(
	sqlExprAttributePath: string,
	tableNameAttribute: string,
	clauseType: SqlClauseType,
	{
		getTableNameFromParent,
		supportsVariables = true // Default to true - all SQL expressions can contain variables
	}: { getTableNameFromParent?: boolean; supportsVariables?: boolean } = {}
): Validator {
	return (node, _config, context) => {
		// STEP 1: Preliminary validation - check if we can proceed
		if (!isValidationContext(context)) return [];

		// Resolve dialect once per validator invocation. Prefer the metadata's
		// dialect (which derives from the active QueryService), fall back to
		// any explicit override on the context, then to the default
		// (ClickHouse) for legacy callers.
		const dialect: SqlDialect =
			context.metadata?.dialect ?? context.dialect ?? defaultDialect;

		const path = sqlExprAttributePath.split('.');
		const sqlValue = path.reduce((obj, field) => {
			try {
				return obj[field];
			} catch {
				return undefined;
			}
		}, node.attributes);
		if (!sqlValue) return [];

		let tableName: string;

		if (getTableNameFromParent) {
			if (!node.parent) {
				logger.error(
					{
						sqlExprAttribute: sqlExprAttributePath,
						tableNameAttribute,
						clauseType
					},
					`Failed to find parent of ${node.tag} when validating SQL expression`
				);
				return [];
			}
			tableName = node.parent.attributes[tableNameAttribute];
		} else {
			tableName = node.attributes[tableNameAttribute];
		}

		if (!tableName || typeof tableName !== 'string') return [];

		// Try to get table from either regular metadata or inline query metadata
		const table = getTableFromContext(tableName, context);
		if (!table) return [];

		const errors = [];

		// Handle both string and array cases
		if (typeof sqlValue === 'string') {
			// Single string case
			const sql = sqlValue;

			// STEP 1.5: Preprocess filter variables for validation (only if this attribute supports them)
			// Replace {{filterId.property}} with valid SQL placeholders so validation can proceed
			const sqlForValidation = supportsVariables
				? preprocessFilterVariablesForValidation(sql)
				: sql;

			// Note: Filter variables are preprocessed for validation but will be processed normally at runtime

			// STEP 2: Syntax validation - check for basic SQL syntax errors
			const syntaxErrors = validateSqlSyntax(sqlForValidation, clauseType);
			if (syntaxErrors.length > 0) {
				errors.push({
					id: 'invalid-sql-syntax',
					level: 'error' as const,
					message: `${sqlExprAttributePath}: ${syntaxErrors[0]}`,
					location: node.location
				});
				return errors; // Return early if syntax is invalid
			}

			// STEP 3: SQL parsing - extract columns and function calls
			const parsed = parseSqlExpression(sqlForValidation, dialect);

			// STEP 4: Column validation - check if referenced columns exist in the table
			// Skip column validation if there's a lambda symbol (->) in the query
			// queries with lambdas declare their own variables inline and will break this
			if (!sqlForValidation.includes('->')) {
				for (const columnName of parsed.columns) {
					const column = table.getColumn(columnName);
					if (!column) {
						errors.push({
							id: 'invalid-column',
							level: 'error' as const,
							message: `${sqlExprAttributePath}: Column "${columnName}" does not exist in table "${tableName}"`,
							location: node.location
						});
					}
				}
			}

			// STEP 5: Function validation - check function names and their usage in this clause context
			const invalidFunctions = validateFunctionNamesByClause(
				parsed.functionCalls,
				clauseType,
				dialect
			);
			for (const { name, possiblyAggregation } of invalidFunctions) {
				errors.push({
					id: 'invalid-function',
					level: 'error' as const,
					message: possiblyAggregation
						? `${sqlExprAttributePath}: Invalid aggregation function "${name}" - did you mean a similar function like "sum", "avg", or "count"?`
						: `${sqlExprAttributePath}: Unknown function "${name}"`,
					location: node.location
				});
			}

			// STEP 6: Type compatibility - check if function arguments have compatible types
			// Only for clauses that can have aggregation functions
			if (['select', 'having'].includes(clauseType)) {
				const typeIncompatibilities = validateFunctionColumnTypeCompatibility(
					parsed.functionCalls,
					table,
					dialect
				);
				for (const {
					functionName,
					columnName,
					expectedType,
					actualType
				} of typeIncompatibilities) {
					errors.push({
						id: 'type-mismatch',
						level: 'error' as const,
						message: `${sqlExprAttributePath}: Function "${functionName}" expects column types (${expectedType}) but column "${columnName}" has type "${actualType}"`,
						location: node.location
					});
				}
			}

			// STEP 7: Clause-specific validation - apply rules specific to the clause type
			const clauseSpecificErrors = validateClauseSpecificRules(sql, parsed, clauseType, dialect);
			for (const message of clauseSpecificErrors) {
				errors.push({
					id: 'clause-specific-error',
					level: 'error' as const,
					message: `${sqlExprAttributePath}: ${message}`,
					location: node.location
				});
			}

			// STEP 8: Check for trailing AND/OR keywords
			const trailingOperatorErrors = checkTrailingLogicalOperators(sql);
			for (const message of trailingOperatorErrors) {
				errors.push({
					id: 'trailing-logical-operator',
					level: 'error' as const,
					message: `${sqlExprAttributePath}: ${message}`,
					location: node.location
				});
			}
		} else if (Array.isArray(sqlValue)) {
			// Array case - validate each expression in the array
			for (let index = 0; index < sqlValue.length; index++) {
				const entry = sqlValue[index];
				// Tooltip-fields-style arrays are objects `{ value, label?, fmt? }`
				// where `value` holds the SQL. Everything else that historically
				// used array-shaped SQL expressions (e.g. map's tooltip_fields)
				// passes raw strings, which still works via the branch below.
				const sql: string | undefined =
					typeof entry === 'string'
						? entry
						: entry && typeof entry === 'object' && typeof entry.value === 'string'
							? entry.value
							: undefined;
				if (sql === undefined) continue;

				const attributeName = `${sqlExprAttributePath}[${index}]`;

				// STEP 1.5: Preprocess filter variables for validation (only if this attribute supports them)
				const sqlForValidation = supportsVariables
					? preprocessFilterVariablesForValidation(sql)
					: sql;

				// Note: Filter variables are preprocessed for validation but will be processed normally at runtime

				// STEP 2: Syntax validation - check for basic SQL syntax errors
				const syntaxErrors = validateSqlSyntax(sqlForValidation, clauseType);
				if (syntaxErrors.length > 0) {
					errors.push({
						id: 'invalid-sql-syntax',
						level: 'error' as const,
						message: `${attributeName}: ${syntaxErrors[0]}`,
						location: node.location
					});
					continue; // Skip to next expression if syntax is invalid
				}

				// STEP 3: SQL parsing - extract columns and function calls
				const parsed = parseSqlExpression(sqlForValidation, dialect);

				// STEP 4: Column validation - check if referenced columns exist in the table
				// Skip column validation if there's a lambda symbol (->) in the query
				if (!sqlForValidation.includes('->')) {
					for (const columnName of parsed.columns) {
						const column = table.getColumn(columnName);
						if (!column) {
							errors.push({
								id: 'invalid-column',
								level: 'error' as const,
								message: `${attributeName}: Column "${columnName}" does not exist in table "${tableName}"`,
								location: node.location
							});
						}
					}
				}

				// STEP 5: Function validation - check function names and their usage in this clause context
				const invalidFunctions = validateFunctionNamesByClause(
				parsed.functionCalls,
				clauseType,
				dialect
			);
				for (const { name, possiblyAggregation } of invalidFunctions) {
					errors.push({
						id: 'invalid-function',
						level: 'error' as const,
						message: possiblyAggregation
							? `${attributeName}: Invalid aggregation function "${name}" - did you mean a similar function like "sum", "avg", or "count"?`
							: `${attributeName}: Unknown function "${name}"`,
						location: node.location
					});
				}

				// STEP 6: Type compatibility - check if function arguments have compatible types
				// Only for clauses that can have aggregation functions
				if (['select', 'having'].includes(clauseType)) {
					const typeIncompatibilities = validateFunctionColumnTypeCompatibility(
						parsed.functionCalls,
						table,
						dialect
					);
					for (const {
						functionName,
						columnName,
						expectedType,
						actualType
					} of typeIncompatibilities) {
						errors.push({
							id: 'type-mismatch',
							level: 'error' as const,
							message: `${attributeName}: Function "${functionName}" expects column types (${expectedType}) but column "${columnName}" has type "${actualType}"`,
							location: node.location
						});
					}
				}

				// STEP 7: Clause-specific validation - apply rules specific to the clause type
				const clauseSpecificErrors = validateClauseSpecificRules(sql, parsed, clauseType, dialect);
				for (const message of clauseSpecificErrors) {
					errors.push({
						id: 'clause-specific-error',
						level: 'error' as const,
						message: `${attributeName}: ${message}`,
						location: node.location
					});
				}

				// STEP 8: Check for trailing AND/OR keywords
				const trailingOperatorErrors = checkTrailingLogicalOperators(sql);
				for (const message of trailingOperatorErrors) {
					errors.push({
						id: 'trailing-logical-operator',
						level: 'error' as const,
						message: `${attributeName}: ${message}`,
						location: node.location
					});
				}
			}
		}

		return errors;
	};
}

/**
 * Validate SQL syntax based on clause type
 */
function validateSqlSyntax(sql: string, clauseType: SqlClauseType): string[] {
	const errors = [];

	// Common validations for all clause types

	// Check for unbalanced parentheses
	const openParens = (sql.match(/\(/g) || []).length;
	const closeParens = (sql.match(/\)/g) || []).length;

	if (openParens !== closeParens) {
		errors.push('Unbalanced parentheses in expression');
	}

	// Check for unclosed string literals
	const singleQuotes = (sql.match(/'/g) || []).length;
	if (singleQuotes % 2 !== 0) {
		errors.push('Unclosed string literal');
	}

	// Initialize variables outside the switch statement to avoid lexical declaration issues
	let filterClauses = [];
	let processedSql = sql;

	// Clause-specific syntax validations
	switch (clauseType) {
		case 'select':
			// SELECT expressions shouldn't include these clauses
			// Allow FILTER(WHERE...) which is valid in ClickHouse SQL
			if (/\bFROM\b/i.test(sql)) {
				errors.push('SELECT expression should not include FROM clause');
			}

			// Check for WHERE/etc outside of FILTER() contexts
			filterClauses = sql.match(/FILTER\s*\(\s*WHERE\s+[^)]+\)/gi) || [];
			processedSql = sql;

			// Remove valid FILTER(WHERE...) clauses from the SQL before checking
			for (const clause of filterClauses) {
				processedSql = processedSql.replace(clause, '');
			}

			// Now check for WHERE/etc in the remaining SQL
			if (/\b(WHERE|GROUP BY|HAVING|ORDER BY|LIMIT)\b/i.test(processedSql)) {
				errors.push(
					'SELECT expression should not include WHERE, GROUP BY, HAVING, ORDER BY, or LIMIT clauses (except within FILTER(WHERE...))'
				);
			}
			break;

		case 'where':
			// WHERE shouldn't have GROUP BY, HAVING, etc.
			if (/\b(GROUP BY|HAVING|ORDER BY|LIMIT)\b/i.test(sql)) {
				errors.push(
					'WHERE expression should not include GROUP BY, HAVING, ORDER BY, or LIMIT clauses'
				);
			}
			break;

		case 'having':
			// HAVING shouldn't have WHERE, ORDER BY, etc.
			if (/\b(WHERE|ORDER BY|LIMIT)\b/i.test(sql)) {
				errors.push('HAVING expression should not include WHERE, ORDER BY, or LIMIT clauses');
			}
			break;

		case 'order':
			// ORDER BY should be simple expressions
			if (/\b(WHERE|GROUP BY|HAVING|LIMIT)\b/i.test(sql)) {
				errors.push(
					'ORDER BY expression should not include WHERE, GROUP BY, HAVING, or LIMIT clauses'
				);
			}
			break;

		case 'qualify':
			// QUALIFY shouldn't have WHERE, GROUP BY, HAVING, ORDER BY, LIMIT
			if (/\b(WHERE|GROUP BY|HAVING|ORDER BY|LIMIT)\b/i.test(sql)) {
				errors.push(
					'QUALIFY expression should not include WHERE, GROUP BY, HAVING, ORDER BY, or LIMIT clauses'
				);
			}
			break;
	}

	return errors;
}

/**
 * Check for trailing logical operators (AND/OR) in SQL expressions
 */
function checkTrailingLogicalOperators(sql: string): string[] {
	const errors = [];

	// Check for AS at the end of the expression
	if (/\b(AS)\s*$/i.test(sql.trim())) {
		errors.push('Expression ends with AS without a following alias');
	}

	// Check for AND/OR at the end of the expression
	if (/\b(AND|OR)\s*$/i.test(sql.trim())) {
		errors.push('Expression ends with AND/OR without a following condition');
	}

	// Advanced check: Look for AND/OR followed by closing parenthesis without condition in between
	const andOrBeforeClosingParensPattern = /\b(AND|OR)\s*\)/gi;
	if (andOrBeforeClosingParensPattern.test(sql)) {
		errors.push('AND/OR keyword followed by closing parenthesis without a condition');
	}

	// Check for AND/OR with a missing right operand before AS
	const andOrBeforeAsPattern = /\b(AND|OR)\s+AS\b/gi;
	if (andOrBeforeAsPattern.test(sql)) {
		errors.push('AND/OR keyword followed by AS without a condition in between');
	}

	return errors;
}

/**
 * Parse a SQL expression to extract columns and function calls
 */
function parseSqlExpression(sql: string, dialect: SqlDialect): ParsedSql {
	// Pre-process the SQL to make extraction easier
	let processedSql = sql;

	// Remove all string literals
	processedSql = processedSql.replace(/'([^'\\]|\\.)*'/g, "''");

	// Remove all comments
	processedSql = processedSql.replace(/--.*$/gm, '');
	processedSql = processedSql.replace(/\/\*[\s\S]*?\*\//g, '');

	// Store extracted function calls and columns
	const functionCalls: FunctionCall[] = [];
	const columnSet = new Set<string>();

	// First pass: extract top-level function calls using regex
	// This regex captures: function_name(argument)
	const functionPattern = /\b([A-Za-z0-9_]+)\s*\(/g;
	let match;

	// Find all function names in the SQL
	const functionMatches: { name: string; index: number }[] = [];
	while ((match = functionPattern.exec(processedSql)) !== null) {
		functionMatches.push({
			name: match[1].toUpperCase(),
			index: match.index + match[1].length + 1 // Position after the opening parenthesis
		});
	}

	// For each function, find its matching closing parenthesis and extract args
	for (const { name, index } of functionMatches) {
		let depth = 1; // We start after opening parenthesis
		let endIndex = index;

		// Find the matching closing parenthesis
		for (let i = index; i < processedSql.length; i++) {
			if (processedSql[i] === '(') {
				depth++;
			} else if (processedSql[i] === ')') {
				depth--;
				if (depth === 0) {
					endIndex = i;
					break;
				}
			}
		}

		if (endIndex > index) {
			// Extract arguments between opening and closing parentheses
			const args = processedSql.substring(index, endIndex).trim();

			// Determine if this is likely an aggregation function
			const possiblyAggregation = !dialect.nonAggregationFunctions.has(name);

			// Add the function call to our collection
			functionCalls.push({
				name,
				args,
				possiblyAggregation
			});

			// Extract column references from function arguments
			if (args !== '*') {
				const argColumns = extractColumnReferences(args);
				argColumns.forEach((col) => columnSet.add(col));
			}
		}
	}

	// Process SQL for column references outside functions
	const remainingColumns = extractColumnReferences(processedSql);
	remainingColumns.forEach((col) => columnSet.add(col));

	return {
		columns: Array.from(columnSet),
		functionCalls
	};
}

/**
 * Extract column references from a SQL fragment
 */
export function extractColumnReferences(sql: string): string[] {
	// Step 1: Remove string literals first to avoid parsing inside them
	let processedSql = sql.replace(/'([^'\\]|\\.)*'/g, "''");

	// Step 2: Handle quoted identifiers (preserve them as single units)
	const quotedIdentifiers: string[] = [];
	const quotedIdentifierMap = new Map<string, string>();

	// Handle double-quoted identifiers: "column name"
	processedSql = processedSql.replace(/"([^"]+)"/g, (match, content) => {
		const placeholder = `__QUOTED_${quotedIdentifiers.length}__`;
		quotedIdentifiers.push(content);
		quotedIdentifierMap.set(placeholder, content);
		return placeholder;
	});

	// Handle backtick-quoted identifiers: `column name`
	processedSql = processedSql.replace(/`([^`]+)`/g, (match, content) => {
		const placeholder = `__QUOTED_${quotedIdentifiers.length}__`;
		quotedIdentifiers.push(content);
		quotedIdentifierMap.set(placeholder, content);
		return placeholder;
	});

	// Step 3: Remove function calls to avoid treating function names as columns
	const functionsToRemove = processedSql.match(/\b[A-Za-z_][A-Za-z0-9_]*\s*\(/g) || [];
	functionsToRemove.forEach((func) => {
		processedSql = processedSql.replace(func, ' ');
	});

	// Step 4: Handle PostgreSQL-style type casting with comprehensive patterns
	processedSql = stripTypeCast(processedSql);

	// Step 5: Handle aliases - remove "AS alias" constructs
	processedSql = processedSql.replace(/\bAS\s+[A-Za-z0-9_]+\b/gi, '');

	// Step 6: Replace operators and punctuation with spaces to isolate identifiers
	processedSql = processedSql.replace(/[=<>!+\-*/%&|^~,.():]+/g, ' ');

	// Step 7: Extract potential column identifiers
	const identifiers = processedSql.match(/\b([A-Za-z_][A-Za-z0-9_]*|__QUOTED_\d+__)\b/g) || [];

	// Step 8: Convert quoted identifier placeholders back to original names
	const finalIdentifiers = identifiers.map((id) => {
		if (quotedIdentifierMap.has(id)) {
			return quotedIdentifierMap.get(id)!;
		}
		return id;
	});

	// Step 9: Filter out SQL keywords and validation placeholders (but preserve quoted identifiers even if they match keywords)
	return finalIdentifiers.filter((id) => {
		// Skip validation placeholders (exact matches or as substrings in compound identifiers)
		if (
			id === '__FRONTMATTER_VAR__' ||
			id === '__FILTER_VAR__' ||
			id.includes('__FRONTMATTER_VAR__') ||
			id.includes('__FILTER_VAR__')
		) {
			return false;
		}
		// If it's a quoted identifier (contains spaces or special chars), keep it
		if (id.includes(' ') || id.includes('-') || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(id)) {
			return true;
		}
		// Otherwise filter out SQL keywords
		return !SQL_KEYWORDS.has(id.toLowerCase());
	});
}

/**
 * Validate function names based on clause type
 */
function validateFunctionNamesByClause(
	functionCalls: FunctionCall[],
	clauseType: SqlClauseType,
	dialect: SqlDialect
): FunctionCall[] {
	const invalidFunctions: FunctionCall[] = [];

	for (const func of functionCalls) {
		// First check if the function name is recognized at all
		const isKnownFunction =
			dialect.aggregationFunctions.has(func.name) ||
			dialect.nonAggregationFunctions.has(func.name);

		if (!isKnownFunction) {
			// If function isn't recognized at all, mark it as invalid
			invalidFunctions.push({
				...func,
				possiblyAggregation: false
			});
			continue;
		}

		// For WHERE clauses, aggregation functions are not allowed
		if (clauseType === 'where' && dialect.aggregationFunctions.has(func.name)) {
			// Skip to avoid duplicate error with validateClauseSpecificRules
			continue;
		}

		// For SELECT, HAVING, and ORDER BY, all known functions are valid
		// No need to add anything to invalidFunctions
	}

	return invalidFunctions;
}

/**
 * Check for type compatibility between function and column type
 */
function validateFunctionColumnTypeCompatibility(
	functionCalls: FunctionCall[],
	table: TableLike,
	dialect: SqlDialect
): TypeIncompatibility[] {
	const incompatibilities: TypeIncompatibility[] = [];

	for (const func of functionCalls) {
		// Skip non-aggregation functions or functions without type rules
		if (!func.possiblyAggregation || !dialect.functionTypeRules[func.name]) {
			continue;
		}

		// Skip wildcards like COUNT(*)
		if (func.args.trim() === '*') {
			continue;
		}

		// Check if the argument is another function call
		// Example: SUM(total_sales) inside ROUND(SUM(total_sales))
		const nestedFunctionMatch = func.args.match(/\b([A-Za-z0-9_]+)\s*\(/);
		if (nestedFunctionMatch) {
			const nestedFuncName = nestedFunctionMatch[1].toUpperCase();
			// If the nested function is a known function, skip column validation
			// as we'll validate each function independently
			if (
				dialect.aggregationFunctions.has(nestedFuncName) ||
				dialect.nonAggregationFunctions.has(nestedFuncName)
			) {
				continue;
			}
		}

		// For complex arguments, we take a conservative approach
		// Only validate simple column references, not expressions
		const columnNames = extractColumnReferences(func.args);
		if (columnNames.length !== 1) {
			// Skip validation for complex expressions with multiple columns
			continue;
		}

		const columnName = columnNames[0];
		if (!columnName) continue;

		// Get the column and its type
		const column = table.getColumn(columnName);
		if (!column) continue; // Column doesn't exist (already handled elsewhere)

		// Compare against the dialect-normalized jsType so this validator stays
		// warehouse-agnostic. Each Metadata loader is responsible for mapping the
		// raw warehouse type (e.g. "Float64", "REAL", "NUMBER(38,0)") to a jsType.
		const columnJsType = column.jsType;
		if (!columnJsType || columnJsType === 'unknown') continue;

		const allowedTypes: ReadonlySet<DialectFunctionTypeRule> | undefined =
			dialect.functionTypeRules[func.name];
		if (!allowedTypes) continue;

		const isCompatible = allowedTypes.has('*') || allowedTypes.has(columnJsType);

		if (!isCompatible) {
			incompatibilities.push({
				functionName: func.name,
				columnName,
				expectedType: Array.from(allowedTypes).join(', '),
				actualType: columnJsType
			});
		}
	}

	return incompatibilities;
}

/**
 * Validate clause-specific rules
 */
function validateClauseSpecificRules(
	sql: string,
	parsed: ParsedSql,
	clauseType: SqlClauseType,
	dialect: SqlDialect
): string[] {
	const errors = [];

	switch (clauseType) {
		case 'where': {
			// Check for aggregation functions in WHERE (not allowed)
			const hasAggregations = parsed.functionCalls.some((func) =>
				dialect.aggregationFunctions.has(func.name)
			);

			if (hasAggregations) {
				errors.push('Aggregation functions are not allowed in WHERE clauses (use HAVING instead)');
			}
			break;
		}

		case 'having':
			// HAVING should typically have at least one aggregation
			// This is more of a warning than an error
			break;

		case 'order':
			// Check for valid ORDER BY syntax (column [ASC|DESC], ...)
			// Allows arithmetic operators (*, -, /) in expressions like sum(unit_price * quantity)
			if (
				!/^[\w\s,.()+*\-/]+(\s+(ASC|DESC))?(\s*,\s*[\w\s.()+*\-/]+(\s+(ASC|DESC))?)*$/i.test(sql)
			) {
				errors.push(
					'Invalid ORDER BY syntax - should be "column [ASC|DESC], column [ASC|DESC], ..."'
				);
			}
			break;

		case 'qualify':
			// Optionally, warn if QUALIFY is used without a window function
			// (not required for basic support)
			break;
	}

	return errors;
}

// ==== CONSTANTS AND SHARED DATA STRUCTURES ====

/**
 * Common SQL keywords to filter out from column references
 */
const SQL_KEYWORDS = new Set([
	'select',
	'as',
	'from',
	'where',
	'group',
	'by',
	'having',
	'order',
	'limit',
	'offset',
	'and',
	'or',
	'not',
	'is',
	'in',
	'between',
	'like',
	'ilike',
	'null',
	'true',
	'false',
	'case',
	'when',
	'then',
	'else',
	'end',
	'cast',
	'try_cast',
	'convert',
	'if',
	'ifnull',
	'nullif',
	'coalesce',
	'current_date',
	'current_timestamp',
	'distinct',
	'asc',
	'desc',
	'over',
	'partition',
	'extract',
	'year',
	'quarter',
	'month',
	'week',
	'day',
	'hour',
	'minute',
	'second',
	// Common SQL data types
	'int',
	'integer',
	'bigint',
	'smallint',
	'tinyint',
	'decimal',
	'numeric',
	'float',
	'double',
	'real',
	'boolean',
	'bool',
	'char',
	'varchar',
	'text',
	'string',
	'date',
	'time',
	'datetime',
	'timestamp',
	'timestamptz',
	'interval',
	'uuid',
	'json',
	'jsonb',
	'blob',
	'binary',
	'varbinary'
]);

// Function inventories (aggregation, non-aggregation) and per-aggregation
// argument-type rules now live on each SqlDialect (see ../../sql-dialect.ts)
// so the validator can stay warehouse-agnostic.
