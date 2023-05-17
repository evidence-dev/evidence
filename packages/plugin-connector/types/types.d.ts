import type { z } from 'zod';
import type {
	EvidencePackageSchema,
	GenericPackageSchema,
	ValidPackageSchema
} from '../src/plugin-discovery/schemas/evidence-package.schema.js';
import {
	EvidenceComponentConfigSchema,
	EvidenceConfigSchema
} from '../src/plugin-discovery/schemas/evidence-config.schema.js';

declare global {
	type GenericPackage = z.infer<typeof GenericPackageSchema>;
	type EvidencePackage = z.infer<typeof EvidencePackageSchema>;
	type ValidPackage = z.infer<typeof ValidPackageSchema>;

	type EvidenceConfig = z.infer<typeof EvidenceConfigSchema>;
	type EvidenceComponentConfig = z.infer<typeof EvidenceComponentConfigSchema>;

	type EvidencePluginPackage<T extends ValidPackage> = {
		package: T;
		path: string;
	};

	type PackageDiscoveryResult = {
		components: EvidencePluginPackage<ValidPackage>[];
		databases: EvidencePluginPackage<EvidencePackage>[];
	};
}
