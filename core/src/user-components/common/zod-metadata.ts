/**
 * TODO replace this with the builtin Zod v4 metadata
 * We can't upgrade to Zod v4 right now because the ai-sdk packages depend on Zod v3
 */

import type z from 'zod';

const METADATA = Symbol('metadata');

export const setZodMetadata = <S extends z.ZodTypeAny>(
	schema: S,
	metadata: Record<string, unknown>
): S => {
	schema._def[METADATA] = metadata;
	return schema;
};

export const getZodMetadata = <M extends Record<string, unknown>>(
	schema: z.ZodTypeAny
): M | undefined => {
	return schema._def?.[METADATA];
};
