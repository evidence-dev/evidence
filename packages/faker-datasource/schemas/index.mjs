import { z } from 'zod';
import { FakerSchema } from './faker.schema.mjs';
import { LiteralSchema } from './literal.schema.mjs';
import { SeriesSchema } from './series.schema.mjs';

export const FakerTableSchema = z.union([FakerSchema, LiteralSchema, SeriesSchema]);
