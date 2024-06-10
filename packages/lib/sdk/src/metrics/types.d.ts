import { QueryValue } from '../usql/index.js';
import {
	MetricTimeGrainsSchema,
	MetricDefSchema,
	MetricSpecSchema,
	MetricSourceSchema,
	MetricFileSchema
} from './schemas/metrics.schema.js';
import { z } from 'zod';
import { Metric } from './Metric.js';

export type MetricTimeGrains = z.infer<typeof MetricTimeGrainsSchema>;
export type MetricDef = z.infer<typeof MetricDefSchema>;
export type MetricSpec = z.infer<typeof MetricSpecSchema>;
export type MetricSource = z.infer<typeof MetricSourceSchema>;
export type MetricFile = z.infer<typeof MetricFileSchema>;

export type ChartSpec = {
	x: string;
	y: string;
	series?: string[];
};

export type MetricCut = {
	dimensions?: string[];
	grain?: MetricTimeGrains;
};


export type MetricValue = QueryValue<any> & Metric