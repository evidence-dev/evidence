# Updating Your Project

When new versions of Evidence are released, we post release notes in [Slack](/community). You can also take a look at our pull requests on GitHub to see which changes are being made.

To get the new changes, run `npm update` in the root of your project. This will check for updated versions of your project's dependencies and will download any applicable updates. Once you run that command and restart the development server (`npm run dev`), you should see the changes in your project.

If you run into any problems with updates, reach out on [Slack](/community) or email <support@evidence.dev>.

:::caution Updating Older Projects
Evidence recently moved to a single dependency structure to make it easier to install and update projects. If you have an Evidence project created before November 9, 2021 and would like to upgrade it to the newest version, the easiest way is to start from a fresh project following the installation instructions, and move over the pages you neeed from your old project. If you need help please reach out and we will be happy to help you with the upgrade.
:::


