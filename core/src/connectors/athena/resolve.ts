import type { AthenaConnection } from './connection-schema';
import type { AthenaCredentials } from './credentials';

/** Config layer → execution layer. Defaults are already applied by the schema parse. */
export function resolveAthenaCredentials(config: AthenaConnection): AthenaCredentials {
	return {
		region: config.region_name,
		...(config.aws_access_key_id ? { accessKeyId: config.aws_access_key_id } : {}),
		...(config.aws_secret_access_key ? { secretAccessKey: config.aws_secret_access_key } : {}),
		...(config.aws_session_token ? { sessionToken: config.aws_session_token } : {}),
		...(config.aws_profile_name ? { profile: config.aws_profile_name } : {}),
		...(config.role_arn ? { roleArn: config.role_arn } : {}),
		...(config.external_id ? { externalId: config.external_id } : {}),
		...(config.s3_staging_dir ? { outputLocation: config.s3_staging_dir } : {}),
		workGroup: config.work_group,
		catalog: config.database,
		schema: config.schema,
		schemas: config.schemas,
		resultReuseMinutes: config.result_reuse_minutes
	};
}
