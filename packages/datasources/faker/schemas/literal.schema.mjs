import { z } from 'zod';

export const LiteralSchema = z.object({
	literal: z.array(
		z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.date(), z.symbol()]))
	)
});
