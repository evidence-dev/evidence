---
sidebar_position: 1
hide_table_of_contents: false
title: Install Evidence
---

If this is your first time doing something like this, or you're having trouble installing, try the [Detailed Installation Walkthrough.](/walkthroughs/installation)


## System Requirements 

Evidence requires **NPM** `Version 7` or higher, and **Node.js** `Version 16.14` or higher.

You can check which version you have using `npm -v` and `node -v`

Install the latest version with `npm install -g npm@latest`



## Install & Launch

```shell
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```

Open your browser and go to [localhost:3000](http://localhost:3000)

The `template` project running in your browser contains a tutorial on how to use Evidence.

### (Optional) Docker Install 

If you'd rather use Docker, see instructions [here](../walkthroughs/other-install-options).

### (Optional) VS Code Extension 
If you use VS Code, the Evidence VS Code Extension adds syntax highlighting and basic autocomplete for 'Evidence flavoured' markdown. You can install the extension from the the [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode). 