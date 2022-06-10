# Contributing to Evidence

Thank you for being an important part of the Evidence community! ❤️ 

This guide is meant for anyone who would like to contribute to Evidence - either through code or through suggestions and ideas. Even if you've never contributed to an open source project before, you are welcome to contribute to Evidence.

## Contents

[Community Rules](#community-rules)

[Create an Issue](#create-an-issue)

[Contribute Code](#contribute-code)

[Join Our Team](#join-our-team)

## Community Rules

1. Be respectful
2. Help each other
3. Document solutions to problems for the benefit of the community

## Create an Issue

Issues can include bugs, feature ideas, docs improvements, database connector requests, and any other suggestions or ideas you have for improving Evidence.

[Create an issue here](https://github.com/evidence-dev/evidence/issues/new/choose)

### How to write a good issue

1. Look before you post - read the docs, check if an issue already exists
2. If an issue already exists, upvote and comment on it! Let us know multiple people have the issue by adding a thumbs up to that issue
3. Use the right issue template - bug report, docs request, feature request, database connector request
4. Give your issue a clear and descriptive title
5. Help us help you - fill out the issue template, give clear system info, error messages, and steps to reproduce

### Resolving issues

If you create a new issue, someone from the Evidence team will respond within 24 hours.

If you have a solution for an issue someone else posted, please comment on that issue with the solution.

### Private information

If your problem relates to sensitive or private information, please don't post any of your data in an issue. We suggest creating a small test dataset that can reproduce the problem without revealing any private info, and posting that data in the issue. If that's not possible, please reach out to support@evidence.dev.

## Contribute Code

### Testing Changes Manually

Follow these steps to test your changes
1. In the project root folder, run `pnpm install`
2. `cd ./sites/example-project`
3. `npm run dev`

You should be able to open the `example-project` on  `localhost:3000`. Any subsequent changes you make will be reflected on the website.


Note that changes to the `components` package should be done within `./sites/example-project/src/components`.  During the build, `./sites/example-project/src/components` will be copied over to `./packages/components`).  All other packages can be updated directly in `./packages`.

### Running the Test Suite locally.
The automated test suite should run upon PR creation via Github actions.
You can also run the tests locally via `pnpm test`.  Note that for the DB tests, enviroment variables need to be test.  Under each DB package, you can add a `.env` file with the credentials needed for each DB type.  Take a look at the `index.cjs` file for the variables required for each DB driver.

### Pull Requests
Pull requests are welcome! We review pull requests as they are submitted and will reach out to you with any questions or comments.

Follow these steps to submit a pull request for your changes:
1. Create a fork of the `evidence` repo
2. Commit your changes to your fork
3. Test your changes to make sure all results are as expected
4. Open a pull request against the `main` branch of the `evidence` repo

[Here's an example of a pull request](https://github.com/evidence-dev/evidence/pull/165) from a community member who built Evidence's MySQL connector.


## Join Our Team

If you're passionate about what we're building at Evidence and want to join our team, reach out to us at support@evidence.dev.
