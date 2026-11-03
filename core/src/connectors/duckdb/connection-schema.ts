import { z } from "zod/v4";
import type { ConnectionFieldMeta } from "../connection-schema";

const meta = (m: ConnectionFieldMeta): ConnectionFieldMeta => m;

export const duckdbBase = z.object({
  type: z.literal("duckdb"),

  database: z
    .string()
    .trim()
    .min(1)
    .default(":memory:")
    .meta(
      meta({
        label: "Database",
        description:
          "Local DuckDB database file path, or :memory: for an in-memory database.",
        category: "context",
      }),
    ),

  schemas: z
    .array(z.string().trim().min(1))
    .default([])
    .meta(
      meta({
        label: "Schemas",
        description:
          "Optional allowlist of schemas exposed to the schema browser.",
        category: "visibility",
      }),
    ),
});

export const duckdbConnectionSchema = duckdbBase;

export type DuckDBConnection = z.infer<typeof duckdbConnectionSchema>;
