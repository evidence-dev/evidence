import { z } from 'zod';
import { getZodMetadata } from './zod-metadata';

type Meta<M extends Record<string, unknown>> = {
	isOptional: boolean;
	defaultValue?: unknown;
	metadata: M;
};

type GetInnerZodSchemaReturnValue<M extends Record<string, unknown>> = {
	schema: z.ZodTypeAny;
} & Meta<M>;

const _getInnerZodSchema = <M extends Record<string, unknown>>(
	schema: z.ZodTypeAny,
	meta: Meta<M>
): GetInnerZodSchemaReturnValue<M> => {
	const metadata = getZodMetadata<M>(schema);
	if (schema instanceof z.ZodOptional) {
		return _getInnerZodSchema(schema._def.innerType, {
			...meta,
			isOptional: true,
			metadata: {
				...meta.metadata,
				...metadata
			}
		});
	}
	if (schema instanceof z.ZodDefault) {
		const defaultValue = schema._def.defaultValue();
		return _getInnerZodSchema(schema._def.innerType, {
			...meta,
			defaultValue,
			metadata: {
				...meta.metadata,
				...metadata
			}
		});
	}
	if (schema instanceof z.ZodEffects) {
		return _getInnerZodSchema(schema._def.schema, {
			...meta,
			metadata: {
				...meta.metadata,
				...metadata
			}
		});
	}
	return { schema, ...meta };
};

export const getInnerZodSchema = <M extends Record<string, unknown>>(
	schema: z.ZodTypeAny
): GetInnerZodSchemaReturnValue<M> => {
	return _getInnerZodSchema<M>(schema, {
		isOptional: false,
		defaultValue: undefined,
		metadata: {} as M
	});
};
