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

5. Install dependencies

```sh
pnpm install --ignore-scripts
```

6. Install Playwright

```sh
pnpm create playwright@latest --lang=js --no-browsers --quiet
```

_Since this installs packages, our `postinstall` script will run to build everything. The Playwright CLI doesn't accept the `--ignore-scripts` flag, so if you want to skip the building, just temporarily remove the `postinstall` script from the root `package.json`._

7. Delete `tests-examples/`

8. Reconfigure `playwright.config.js` to use `import`/`export` syntax

```diff
-const { defineConfig, devices } = require('@playwright/test');
+import { defineConfig, devices } from '@playwright/test';
```

```diff
-module.exports = defineConfig({
+export default defineConfig({
```

9. Rename `tests/example.spec.js` to `tests/tests.spec.js`

10. Recondigure `tests/tests.spec.js` to use `import`/`export` syntax

```diff
-const { test, expect } = require('@playwright/test');
+import { test, expect } from '@playwright/test';
```

11. Install `cross-env`

```sh
pnpm install -D cross-env --ignore-scripts
```

12. Replace the `test` script in `package.json` with the following

```diff
{
	"scripts": {
-		"test": "evidence build",
+		"test": "playwright test",
+		"test:dev": "cross-env DEV=true playwright test"
	}
}
```

13. Run the tests!

```sh
pnpm test
```

Output:

```
> my-evidence-project@0.0.1 test /home/zach/code/evidence/evidence/e2e/hmr
> playwright test


Running 6 tests using 4 workers
  6 passed (4.7s)

To open last HTML report run:

  pnpm exec playwright show-report
```

14. Commit and push your changes

```sh
# Make sure the .evidence/meta and .evidence/template directories aren't committed, they should be in the .gitignore
# If they are showing in your diff, run the following:
git rm -r --cached .evidence/meta .evidence/template

git add .
git commit -m "test: add e2e/my-tests"
```

You're now ready to start writing your tests!

## Commands

`pnpm test` will first build and run the app in preview mode, then run the tests

`pnpm test:dev` will first run the dev server, then run the tests

Adding `--ui` to either test command will open the Playwright interactive UI to help debug tests easier
