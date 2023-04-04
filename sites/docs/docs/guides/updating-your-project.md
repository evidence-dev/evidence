---
title: Updating Your Project
sidebar_position: 3
---

When new versions of Evidence are released, we post release notes in [Slack](/community). You can also take a look at our pull requests on GitHub to see which changes are being made.

To get the new changes, run `npm update` in the root of your project. This will check for updated versions of your project's dependencies and will download any applicable updates. Once you run that command and restart the development server (`npm run dev`), you should see the changes in your project.

For major updates (which may include breaking changes), run `npm install @evidence-dev/evidence@latest`.

If you run into any problems with updates, reach out on [Slack](/community) or email <support@evidence.dev>.
