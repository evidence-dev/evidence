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

import {
	DatasourceQueryResultSchema,
	DatasourceQuerySchema,
	DatasourceSpecFileSchema,
	DatasourceSpecSchema
} from '../src/data-sources/schemas/datasource-spec.schema';
import {
	DatabaseConnectorFactorySchema,
	DatabaseConnectorSchema,
	QueryResultSchema,
	QueryRunnerSchema
} from '../src/data-sources/schemas/query-runner.schema';

declare global {
	type GenericPackage = z.infer<typeof GenericPackageSchema>;
	type EvidencePackage = z.infer<typeof EvidencePackageSchema>;

	type EvidenceDatabasePackage = EvidencePackage & {
		evidence: { databases: NonNullable<EvidencePackage['evidence']['databases']> };
		main: string;
	};

	type ValidPackage = z.infer<typeof ValidPackageSchema>;

	type EvidenceConfig = z.infer<typeof EvidenceConfigSchema>;
	type EvidenceComponentConfig = z.infer<typeof EvidenceComponentConfigSchema>;

	type EvidencePluginPackage<T extends ValidPackage> = {
		package: T;
		path: string;
	};

	type PackageDiscoveryResult = {
		components: EvidencePluginPackage<ValidPackage>[];
		databases: EvidencePluginPackage<EvidenceDatabasePackage>[];
	};

	type DatasourceQuery = z.infer<typeof DatasourceQuerySchema>;

	type DatasourceSpecFile = z.infer<typeof DatasourceSpecFileSchema>;

	type DatasourceSpec = z.infer<typeof DatasourceSpecSchema>;

	type DatasourceQueryResult = z.infer<typeof DatasourceQueryResultSchema>;

	type DatabaseConnector = z.infer<typeof DatabaseConnectorSchema>;

	type QueryRunner = z.infer<typeof QueryRunnerSchema>;

	type QueryResult = z.infer<typeof QueryResultSchema>;

	type DatabaseConnectorFactory = z.infer<typeof DatabaseConnectorFactorySchema>;
}
