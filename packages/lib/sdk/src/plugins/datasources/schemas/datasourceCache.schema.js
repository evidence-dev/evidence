import { z } from 'zod';

export const DatasourceCacheSchema = z.record(z.record(z.string().or(z.null())));
