import {
	MetricTimeGrainsSchema,
	MetricDefSchema,
	MetricFileSchema
} from './schemas/metrics.schema.js';
import { z } from 'zod';
export type MetricTimeGrains = z.infer<typeof MetricTimeGrainsSchema>;
export type MetricDef = z.infer<typeof MetricDefSchema>;
export type MetricFile = z.infer<typeof MetricFileSchema>;
