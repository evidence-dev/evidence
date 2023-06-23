import { z } from "zod";

export const QueryResultSchema = z.object({
    data: z.array(z.record(z.string(), z.any())),
    columns: z.array(z.object({ title: z.string(), type: z.any() })),
});

export const QueryRunnerSchema = z
    .function()
    .args(
        z.string({ description: "QueryString" }),
        z.string({ description: "QueryFilepath" })
    )
    .returns(z.promise(QueryResultSchema.or(z.null())));

export const DatabaseConnectorFactorySchema = z
    .function()
    .args(
        z.any({ description: "Connection Options" }),
        z.string({ description: "Datasource directory" })
    )
    .returns(z.promise(
        QueryRunnerSchema
    ));

export const DatabaseConnectorSchema = z.object({
    getRunner: DatabaseConnectorFactorySchema,
    supports: z.array(z.string()),
});