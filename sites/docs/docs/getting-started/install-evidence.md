---
sidebar_position: 1
hide_table_of_contents: false
title: Install Evidence
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

If this is your first time doing something like this, or you're having trouble installing, try the [Detailed Installation Walkthrough.](/walkthroughs/installation)


## System Requirements 

Evidence requires **NPM** `Version 7` or higher, and **Node.js** `Version 14` or higher.

You can check which version you have using `npm -v` and `node -v`

Install the latest version with `npm install -g npm@latest`

## Install & Launch

<Tabs>
<TabItem value="standalone" label="Stand-alone" default>

```shell
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```
<p class="standard-margin">Open your browser and go to <a href="http://localhost:3000">http://localhost:3000</a></p>
<p class="standard-margin">The <code>template</code> project running in your browser contains a tutorial on how to use Evidence.</p>
</TabItem>

<TabItem value="dbt" label="With dbt">

```shell
cd path/to/your/dbt/project
npx degit evidence-dev/template reports
npm --prefix ./reports install
npm --prefix ./reports run dev
```
<p class="standard-margin">If you use dbt, it is suggested (but not required) that you install Evidence inside your dbt project, inside a folder called <code>reports</code>, thereby creating a <a href="https://github.com/archiewood/analytics_monorepo">monorepo</a>.</p>
<p class="standard-margin">This currently needs to be done from the terminal, rather than from the dbt Cloud UI.</p>
<p class="standard-margin">Then you can make changes across your modelling layer (in <code>/models</code>) and your reporting layer (in <code>reports</code>) in the same commits.</p>
</TabItem>

<TabItem value="docker" label="Docker">
<p class="standard-margin">Evidence provides a development Docker image.</p>
<p class="standard-margin">See our <a href="https://github.com/evidence-dev/docker-devenv">Docker Development Environment repository</a> for instructions.</p>
</TabItem>
</Tabs>


### (Optional) VS Code Extension 
If you use VS Code, the Evidence VS Code Extension adds syntax highlighting and basic autocomplete for 'Evidence flavoured' markdown. You can install the extension from the the [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode). 
