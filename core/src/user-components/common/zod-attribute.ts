import type {
	Config,
	CustomAttributeTypeInterface,
	Scalar,
	ValidationError
} from '@markdoc/markdoc';
import { z } from 'zod';
import type { AttributeTypeWithZodSchema } from '../types';
import { getInnerZodSchema } from './getInnerZodSchema';

// Helper function to get nested value from object using path array
function getNestedValue(obj: unknown, path: string[]): unknown {
	if (typeof obj !== 'object' || obj === null) {
		return undefined;
	}

	let current = obj as Record<string, unknown>;
	for (let i = 0; i < path.length; i++) {
		const key = path[i];
		if (current[key] === undefined) {
			return undefined;
		}
		if (i < path.length - 1) {
			if (typeof current[key] !== 'object' || current[key] === null) {
				return undefined;
			}
			current = current[key] as Record<string, unknown>;
		} else {
			return current[key];
		}
	}
	return current;
}

export function recursivelyReplaceVariables(
	value: unknown,
	variables: Record<string, unknown>
): unknown {
	if (
		typeof value === 'object' &&
		value !== null &&
		'$$mdtype' in value &&
		value.$$mdtype === 'Variable' &&
		'path' in value &&
		Array.isArray(value.path)
	) {
		const variableValue = getNestedValue(variables, value.path);
		return variableValue !== undefined ? variableValue : value;
	}
	if (Array.isArray(value)) {
		return value.map((item) => recursivelyReplaceVariables(item, variables));
	}
	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, value]) => [
				key,
				recursivelyReplaceVariables(value, variables)
			])
		);
	}
	return value;
}

/**
 * Regex pattern to detect variable syntax in strings.
 * Used to skip validation for values that will be resolved at runtime.
 */
const VARIABLE_PATTERN = /\{\{[^}]+\}\}/;

/**
 * Check if a string value contains variable syntax.
 */
function containsVariableSyntax(value: unknown): boolean {
	return typeof value === 'string' && VARIABLE_PATTERN.test(value);
}

/**
 * Zod schema for Number attributes that also accept variable strings.
 * Use this for numeric props that should support variable interpolation.
 *
 * At runtime, the component should use processVariables() with coerceTypes: true
 * to convert the resolved value back to a number.
 */
export const numberVariableSchema = z.union([z.number(), z.string()]).refine(
	(val) => {
		// If it's a number, always valid
		if (typeof val === 'number') return true;
		// If it's a string with variable syntax, skip validation (will be resolved at runtime)
		if (containsVariableSyntax(val)) return true;
		// If it's a plain string, try to parse as number
		const num = Number(val);
		return !isNaN(num);
	},
	{ message: 'Must be a number or a variable reference' }
);

/**
 * Zod schema for axis min/max values that accept numbers, strings (dates/categories), or variable references.
 * Use this for axis min/max options that need to support date-based or categorical axes.
 *
 * At runtime, the component should handle the value appropriately based on axis type.
 */
export const axisValueVariableSchema = z.union([z.number(), z.string()]).refine(
	(val) => {
		// Numbers are always valid
		if (typeof val === 'number') return true;
		// Strings are valid (can be dates, categories, or variable references)
		if (typeof val === 'string') return true;
		return false;
	},
	{ message: 'Must be a number, date string, or a variable reference' }
);

/**
 * Zod schema for Boolean attributes that also accept variable strings.
 * Use this for boolean props that should support variable interpolation.
 *
 * At runtime, the component should use processVariables() with coerceTypes: true
 * to convert the resolved value back to a boolean.
 */
export const booleanVariableSchema = z.union([z.boolean(), z.string()]).refine(
	(val) => {
		// If it's a boolean, always valid
		if (typeof val === 'boolean') return true;
		// If it's a string with variable syntax, skip validation (will be resolved at runtime)
		if (containsVariableSyntax(val)) return true;
		// If it's a plain string, check if it's "true" or "false"
		return val === 'true' || val === 'false';
	},
	{ message: 'Must be a boolean or a variable reference' }
);

export class ZodAttribute implements CustomAttributeTypeInterface {
	constructor(readonly schema: z.ZodSchema) {}

	static create<S extends z.ZodTypeAny>(schema: S): AttributeTypeWithZodSchema<S> {
		return class extends ZodAttribute {
			static zodSchema = schema;
			constructor() {
				super(schema);
			}
		};
	}

	validate(value: unknown, config: Config, attributeName: string): ValidationError[] {
		value = recursivelyReplaceVariables(value, config.variables ?? {});
		const { error } = this.schema.safeParse(value);
		if (!error) return [];

		return error.errors.map((error) => ({
			id: error.code,
			level: 'error',
			message: error.path.length
				? `${attributeName}.${error.path.join('.')}: ${error.message}`
				: `${attributeName}: ${error.message}`
		}));
	}

	transform(value: unknown, config: Config): Scalar {
		value = recursivelyReplaceVariables(value, config.variables ?? {});
		const { success, data } = this.schema.safeParse(value);

		// If parsing fails, use default value if we have one
		if (!success) {
			const inner = getInnerZodSchema(this.schema);
			if (inner.defaultValue) {
				return inner.defaultValue as Scalar;
			}
		}
		return data;
	}
}

/**
 * Pre-built ZodAttribute type for Number props that support variables.
 * Usage in schema: `type: NumberVariable`
 */
export const NumberVariable = class extends ZodAttribute {
	static zodSchema = numberVariableSchema;
	constructor() {
		super(numberVariableSchema);
	}
};

/**
 * Pre-built ZodAttribute type for Boolean props that support variables.
 * Usage in schema: `type: BooleanVariable`
 */
export const BooleanVariable = class extends ZodAttribute {
	static zodSchema = booleanVariableSchema;
	constructor() {
		super(booleanVariableSchema);
	}
};
