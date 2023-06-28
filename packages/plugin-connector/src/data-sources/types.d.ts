declare interface PluginDatabases {
	[database: string]: {
		package: EvidencePluginPackage<EvidenceDatabasePackage>;
		factory: DatabaseConnectorFactory;
	};
}
