declare module '$evidence/config' {
	type EvidenceConfigSchema =
		typeof import('../../configuration/schemas/config.schema.js').EvidenceConfigSchema;
	export type EvidenceConfig = import('zod').z.infer<EvidenceConfigSchema>;
	export const config: EvidenceConfig;
}
