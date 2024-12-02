# E2E Tests

This directory of tests is for end-to-end testing of _real_ Evidence projects (created from our template). Each project should be focused on creating an environment to test a certain subset of features of Evidence. This structure was heavily inspired by how [Vite](https://github.com/vitejs/vite/tree/main/playground) and [SvelteKit](https://github.com/sveltejs/kit/tree/main/packages/kit/test) structure their E2E tests.

## How to create another test project

1. Create a new Evidence project from the template

```sh
npx degit https://github.com/evidence-dev/template my-tests
cd my-tests
```

_Replace `my-tests` with the name of your new test suite here and in the subsequent commands._

2. Add `"private": true` to `package.json`

3. Replace `@evidence-dev` dependency versions with `workspace:*` in `package.json`

```diff
{
	"dependencies": {
-		"@evidence-dev/bigquery": "^2.0.7",
-		"@evidence-dev/core-components": "^4.7.2",
-		"@evidence-dev/csv": "^1.0.12",
-		...
+		"@evidence-dev/bigquery": "workspace:*",
+		"@evidence-dev/core-components": "workspace:*",
+		"@evidence-dev/csv": "workspace:*",
+		...
	}
}

```

4. Delete `package-lock.json`

5. Install dependencies with PNPM

```sh
pnpm install --ignore-scripts
```

6. Install Playwright

```sh
pnpm create playwright@latest --lang=js --no-browsers --no-examples --quiet
```

_Since this installs a package, our `postinstall` script will run to build everything. The Playwright CLI doesn't accept the `--ignore-scripts` flag, so if you want to skip the building, just temporarily remove the `postinstall` script from the root `package.json`._

7. Configure Playwright

In `playwright.config.js`, replace the default config with our shared config in `e2e/playwright-config.js`

You can override any options necessary for your new test project ([see here for an example](/e2e/hmr/playwright.config.js))

```js
import { defineConfig } from '@playwright/test';
import { config } from '../playwright-config';

export default defineConfig(config);
```

8. Create `tests/tests.spec.js` with the following contents

_If necessary, create multiple test files for your project_

```js
// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageToLoad } from '../../test-utils';

test('has title', async ({ page }) => {
	await page.goto('/');
	await waitForPageToLoad(page);

	await expect(page).toHaveTitle(/Welcome to Evidence/);
});
```

9. Install `cross-env`

```sh
pnpm install -D cross-env --ignore-scripts
```

10. Replace the `test` script in `package.json` with the following

```diff
{
	"scripts": {
-		"test": "evidence build",
+		"test:preview": "cross-env playwright test",
+		"test:dev": "cross-env DEV=true playwright test"
	}
}
```

11. Run the tests!

```sh
pnpm test:dev

pnpm build
pnpm test:preview
```

12. Commit and push your changes

```sh
# Make sure the .evidence/meta and .evidence/template directories aren't committed, they should be in the .gitignore
# If they are showing in your diff, run the following:
git rm -r --cached .evidence/meta .evidence/template

git add .
git commit -m "test: add e2e/my-tests"
```

You're now ready to start writing your tests!
