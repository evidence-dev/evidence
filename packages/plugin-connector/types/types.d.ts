import type { z } from "zod";
import type { EvidencePackageSchema } from "../src/plugin-discovery/schemas/evidence-package.schema.js";
import { EvidenceConfigSchema } from "../src/plugin-discovery/schemas/evidence-config.schema.js";

declare global {
  declare type EvidencePlugins = {
    components: EvidencePackage[];
    databases: DatabaseConnector[];
  };

  declare type EvidencePackage = z.infer<typeof EvidencePackageSchema>;

  declare type EvidenceConfig = z.infer<typeof EvidenceConfigSchema>;

  declare type EvidencePluginPackage = {
    package: EvidencePackage;
    path: string;
  };

  declare type EvidencePluginDiscoveryResult = {
    components: EvidencePluginPackage[];
    databases: EvidencePluginPackage[];
  };
}
