---
sidebar_position: 3
hide_table_of_contents: false
title: Install Evidence
description: Install Evidence with the VSCode Extension, from the command line, alongside dbt, or using Codespaces.
---

<Alert status=success>

The easiest way to get started with Evidence is to use the [VSCode Extension](vscode:extension/Evidence.evidence-vscode).

</Alert>

## VSCode Extension

1. Install Evidence from the VSCode Marketplace
2. Open the Command Palette (`Ctrl/Cmd + Shift + P`) and enter `Evidence: New Evidence Project`
3. Click `Start Evidence` in the bottom status bar
   - This will install required dependencies and start the Evidence server
   - You should see a browser window open automatically with your app preview
   - On Windows, this step can take a couple of minutes the first time
4. Make changes to a markdown file and **save the file** to see the updates in your browser window


The template app running in your browser contains a tutorial on how to use Evidence.

<LinkButton url="https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode">Install VSCode Extension</LinkButton>

<br/>
<br/>

If you run into any issues, [reach out in Slack.](https://slack.evidence.dev)

## Other Options

<Tabs>

<Tab value="standalone" label="Command Line" default>

```shell
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run sources
npm run dev
```

</Tab>

<Tab value="dbt" label="With dbt">

```shell
cd path/to/your/dbt/project
npx degit evidence-dev/template reports
npm --prefix ./reports install
npm --prefix ./reports run sources
npm --prefix ./reports run dev
```

You can install Evidence inside your dbt project, inside a folder called `reports`, to create a [monorepo](https://github.com/archiewood/analytics_monorepo).

This allows changes across your modelling layer (in `/models`) and your reporting layer (in `reports`) in the same commits.

This currently needs to be done from the terminal, rather than from the dbt Cloud UI.

</Tab>

<Tab value="codespaces" label="Codespaces">

<LinkButton url='https://github.com/codespaces/new?machine=standardLinux32gb&repo=399252557&ref=main&geo=UsEast'>
   Create Evidence Codespace
</LinkButton>



<br/><br/>

**Note:** Codespaces is much faster on the Desktop app. After the Codespace has booted, select the hamburger menu &rarr; Open in VS Code Desktop.

</Tab>
</Tabs>

## System Requirements

See [system requirements page](/guides/system-requirements).

## Updating Evidence

See [updating your app](/guides/updating-your-app).
