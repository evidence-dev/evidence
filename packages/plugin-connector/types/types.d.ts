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
	ConnectionTesterSchema,
	DatasourceConnectorFactorySchema,
	DatasourceConnectorSchema,
	DatasourceOptionSpecSchema,
	QueryResultSchema,
	QueryRunnerSchema
} from '../src/data-sources/schemas/query-runner.schema';

import { ProcessSource, SourceDirectory as SD } from '@evidence-dev/db-commons';

declare global {
	type GenericPackage = z.infer<typeof GenericPackageSchema>;
	type EvidencePackage = z.infer<typeof EvidencePackageSchema>;

	type EvidenceDatasourcePackage = EvidencePackage & {
		evidence: { datasources: NonNullable<EvidencePackage['evidence']['datasources']> };
		main: string;
	};

	type PluginDatasources = {
		[datasource: string]: {
			package: EvidencePluginPackage<EvidenceDatasourcePackage>;
			factory: DatasourceConnectorFactory;
			options: DatasourceOptionsSpec;
			testConnection: ConnectionTester;
			processSource?: ProcessSource<any>;
		};
	};
	type SourceDirectory = SD;

	type ConnectionTester = z.infer<typeof ConnectionTesterSchema>;

	type ValidPackage = z.infer<typeof ValidPackageSchema>;

	type EvidenceConfig = z.infer<typeof EvidenceConfigSchema>;
	type EvidenceComponentConfig = z.infer<typeof EvidenceComponentConfigSchema>;

	type EvidencePluginPackage<T extends ValidPackage> = {
		package: T;
		path: string;
	};

	type PackageDiscoveryResult = {
		components: EvidencePluginPackage<ValidPackage>[];
		datasources: EvidencePluginPackage<EvidenceDatasourcePackage>[];
	};

	type DatasourceQuery = z.infer<typeof DatasourceQuerySchema>;

	type DatasourceSpecFile = z.infer<typeof DatasourceSpecFileSchema>;

	type DatasourceSpec = z.infer<typeof DatasourceSpecSchema>;

	type DatasourceQueryResult = z.infer<typeof DatasourceQueryResultSchema>;

	type DatasourceOptionsSpec = z.infer<typeof DatasourceOptionSpecSchema>;

	type DatasourceConnector = z.infer<typeof DatasourceConnectorSchema>;

	type DatasourceConnectorFactory = z.infer<typeof DatasourceConnectorFactorySchema>;

	type QueryRunner = z.infer<typeof QueryRunnerSchema>;

	type QueryResult = z.infer<typeof QueryResultSchema>;
}
