import { z } from "zod";

export const EvidenceConfigSchema = z.object({
  components: z.record(
    z.string(),
    z.object({
      overrides: z.record(z.string(), z.string()).optional(),
      aliases: z.record(z.string(), z.string()).optional(),
    })
  ),
}).nonstrict();