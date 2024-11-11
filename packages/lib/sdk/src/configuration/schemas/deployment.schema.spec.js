import { describe, expect, it } from 'vitest';
import { DeploymentConfigSchema } from './deployment.schema';

describe('DeploymentConfigSchema', () => {
	describe('basePath', () => {
		it('should allow undefined', () => {
			const config = {
				basePath: undefined
			};
			const { success, error } = DeploymentConfigSchema.safeParse(config);
			console.log({ error });
			expect(success).toBeTruthy();
		});
		it('should default to /', () => {
			const config = {};
			const { data } = DeploymentConfigSchema.safeParse(config);
			expect(data.basePath).toBe('/');
		});
		it('should not allow protocol', () => {
			const config = {
				basePath: 'http://example.com'
			};
			const { success } = DeploymentConfigSchema.safeParse(config);
			expect(success).toBeFalsy();
		});
		it('should not allow path that doesnt start with /', () => {
			const config = {
				basePath: 'my-base-path'
			};
			const { success } = DeploymentConfigSchema.safeParse(config);
			expect(success).toBeFalsy();
		});
	});
});
