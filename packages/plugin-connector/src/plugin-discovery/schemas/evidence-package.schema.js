import {z} from "zod";

export const EvidencePackageSchema = z.object({
    evidence: z.object({
        components: z.boolean().optional(),
        databases: z.array(z.string()).optional()
    }),
    name: z.string(),
    main: z.string().optional()
})
