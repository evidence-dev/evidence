# Tests

This folder contains UI testing for this monorepo project.

## UI

The folder `UI` contains `playwright` tests for our components.

Each test is named in the format `*.spec.test` the first word should be the main subject of your test.

e.g. `signIn.spec.test` should test a sign in interaction.

## Running tests locally

1. To run the tests locally, you need to have a local server running _on port 3000_: `pnpm run dev`
1. Then run the tests (in another terminal) with: `pnpm run test:ui`
