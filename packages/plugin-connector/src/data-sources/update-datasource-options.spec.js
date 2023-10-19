import { describe, expect, it, vi } from 'vitest';
import { sepSecrets, updateDatasourceOptions } from './update-datasource-options';
import * as fixture from "./update-datasource-options.fixture"
import mockfs from "mock-fs"

mockfs({
    "sources": {
        "somesource": {
            "connection.yaml": ""
        }
    }
})

describe('updateDatasourceOptions', () => {
	it('Should be defined', () => expect(updateDatasourceOptions).toBeDefined());

    


	it("Should let me run it with demo data, even though I'm not worried about the test", () => {
		updateDatasourceOptions(fixture.postgres.opts, {postgres: fixture.postgres.package});
		expect(1).toBe(1);
	});
});



describe('sepSecrets', () => {
    it("Should follow children to ensure they aren't abandoned", async () => {
        const res = await sepSecrets(
            fixture.postgres.opts.options,
            {postgres: {
                ...fixture.postgres.package,
                options: {
                    ...fixture.postgres.package.options,
                    ssl: {
                        ...fixture.postgres.package.options.ssl,
                        nest: false
                    }
                }
            }}.postgres.options
        )
        expect(res._var.sslmode).toBe("require")
    })

    it("Should nest children when asked to do so", async () => {
        const res = await sepSecrets(fixture.postgres.opts.options, fixture.postgres.package.options)
        expect(res._var.ssl.sslmode).toBe("require")
    })

    it("Should not leave dangling values when nesting", async () => {
        const res = await sepSecrets(fixture.postgres.opts.options, fixture.postgres.package.options)
        expect(res._var.ssl.sslmode).toBe("require")
        expect(res.secret.ssl).toBeUndefined()
    })
})