---
sidebar_position: 2
hide_table_of_contents: false
title: Install Evidence
description: The easiest way to get started with Evidence is to use the VSCode Extension.
---

The easiest way to get started with Evidence is to use the VSCode Extension.

## VSCode Extension

1. Download Evidence from the VSCode Marketplace
2. Open the Command Palette (F1) and enter `Evidence: New Evidence Project`
3. Click `Start Evidence` in the bottom status bar


The template project running in your browser contains a tutorial on how to use Evidence.

<a class="external" href="https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode">
Download VSCode Extension
</a>

## System Requirements

Evidence requires:

- **Node.js** `Version 16.14` or higher
- **NPM** `Version 7` or higher

Check your versions with `node -v` and `npm -v`

- Update to the latest npm version with `npm install -g npm@latest`

<a class="external" href="https://nodejs.org/en/download">Download Node.js + NPM</a>


## Other Options

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>

<TabItem value="standalone" label="Command Line" default>

```shell
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run dev
```

</TabItem>

<TabItem value="dbt" label="With dbt">

```shell
cd path/to/your/dbt/project
npx degit evidence-dev/template reports
npm --prefix ./reports install
npm --prefix ./reports run dev
```

<p class="standard-margin">You can install Evidence inside your dbt project, inside a folder called <code>reports</code>, to create a <a href="https://github.com/archiewood/analytics_monorepo">monorepo</a>.</p>
<p class="standard-margin">This allows changes across your modelling layer (in <code>/models</code>) and your reporting layer (in <code>reports</code>) in the same commits.</p>
<p class="standard-margin">This currently needs to be done from the terminal, rather than from the dbt Cloud UI.</p>

</TabItem>

<TabItem value="codespaces" label="Codespaces">

<a class="external" href="https://github.com/codespaces/new?machine=standardLinux32gb&repo=399252557&ref=main&geo=UsEast">
Create Evidence Codespace
</a>
<br/><br/>

**Note:** Codespaces is much faster on the Desktop app. After the Codespace has booted, select the hamburger menu &rarr; Open in VS Code Desktop.

</TabItem>

<TabItem value="docker" label="Docker">
<p class="standard-margin">Evidence provides a development Docker image.</p>
<p class="standard-margin">See our <a href="https://github.com/evidence-dev/docker-devenv">Docker Development Environment repository</a> for instructions.</p>
</TabItem>
</Tabs>