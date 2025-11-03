# Contributing to Evidence

Thank you for being an important part of the Evidence community! ❤️

This guide is meant for anyone who would like to contribute to Evidence - either through code or through suggestions and ideas. Even if you've never contributed to an open source project before, you are welcome to contribute to Evidence.

## Contents

[Community Rules](#community-rules)

[Report an Issue](#report-an-issue)

[Request a Feature](#request-a-feature)

[Contribute Code](#contribute-code)

[Join Our Team](#join-our-team)

## Community Rules

1. Be respectful
2. Help each other
3. Document solutions to problems for the benefit of the community

## Report an Issue

Open issues for bugs, docs improvements or errors.

[Create an issue here](https://github.com/evidence-dev/evidence/issues/new/choose)

### Private information

If your problem relates to sensitive or private information, please don't post any of your data in an issue. We suggest creating a small test dataset that can reproduce the problem without revealing any private info, and posting that data in the issue. If that's not possible, please reach out to support@evidence.dev.

## Request a Feature

To request a feature, a new data source, or ask for help, create a GitHub discussion.

[Create a discussion here](https://github.com/evidence-dev/evidence/discussions/new/choose)

## Contribute Code

### Getting Started

Follow these steps to test your changes, once you've started the example project (per steps below),
you should be able to open the `Evidence Development Workspace` on `localhost:3000`. Any subsequent changes you make will be reflected on the website.

Open a terminal and make sure `pnpm` is installed with:

```bash
npm i -g pnpm
```

In the project root folder, run:

```bash
pnpm install
```

In the project root folder, run:

```bash
pnpm run sources:example-project
```

In the project root folder, run:

```bash
pnpm run dev:core-components
```

**In another terminal**, run:

```bash
pnpm run dev:example-project
```

#### Cannot find package Error

If you get: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package [...]`. You might need to clean the `caches`

At the `root` of the project, run:

```bash
rm -rf ./**/.parcel-cache node_modules ./**/dist
```

And reinstall with:

```bash
pnpm i
```

### Running the Test Suite locally.

The automated test suite should run upon PR creation via Github actions.
You can also run the tests locally via `pnpm test`.

**Note that for the DB tests, enviroment variables are needed for the test to run.**

Under each DB package, you can add a `.env` file with the credentials needed for each DB type. Take a look at the `index.cjs` file for the variables required for each DB driver.

### Pull Requests

Pull requests are welcome! We review pull requests as they are submitted and will reach out to you with any questions or comments.

Follow these steps to submit a pull request for your changes:

1. Create a fork of the `evidence` repo
2. Commit your changes to your fork
3. Test your changes to make sure all results are as expected
4. Format your code to prevent linting errors `pnpm run format`
5. Add a [changeset](#adding-a-changeset)
6. Open a pull request against the `main` branch of the `evidence` repo

[Here's an example of a pull request](https://github.com/evidence-dev/evidence/pull/165) from a community member who built Evidence's MySQL connector.

#### Adding a Changeset

Changesets ensure that package versions are updated correctly before releasing onto NPM.

1. `cd` to the root of the monorepo
2. `pnpm changeset`
3. Follow the steps in the CLI to add some change notes:
   1. Bump the packages that have changed
   2. Most things are patch changes, not major or minor patch bumps
   3. Unless you're making changes that will break someone's project, or change it in a really unexpected way, just do a patch release
4. Commit the release notes to your branch so they'll be included as part of the PR
   1. the file will be called three random words like delighted-fish-brick.md

## Join Our Team

If you're passionate about what we're building at Evidence and want to join our team, reach out to us at <support@evidence.dev>.
