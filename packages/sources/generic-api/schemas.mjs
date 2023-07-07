import {z} from "zod";


export const ApiRequestSpecSchema = z.object({
    path: z.string(),
    query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    method: z.preprocess(x => x.toUpperCase?.(), z.enum(["GET", "POST"])).default("GET"),
    body: z.any().optional(),
    data_field: z.string().optional()
})
