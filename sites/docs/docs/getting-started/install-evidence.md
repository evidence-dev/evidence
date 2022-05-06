---
sidebar_position: 1
hide_table_of_contents: false
---

# Install Evidence

If this is your first time doing something like this, or you just need a reminder, check out the [Detailed Installation Walkthrough.](/walkthroughs/installation)


## System Requirements 

Evidence requires NPM `Version 7` or higher. 

Check which version you have with `npm -v` 

Install the latest version with `npm install -g npm@latest`

### Alternatively using a Docker container instead of NPM
Typically you'd need to have `npm` installed to work with Evidence. However, if you are familiar with Docker, and wish not to work with `npm`, Evidence provides a development Docker image.  Take a look at our [Docker Development Environment](https://github.com/evidence-dev/docker-devenv) repository for more details if you wish to go down this path.

## Install & Launch

```shell
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```

Open your browser and go to [localhost:3000](http://localhost:3000)

## VS Code Extension (Optional)
If you use VS Code, the Evidence VS Code Extension adds handy syntax highlighting and basic autocomplete for 'Evidence flavoured' markdown. You can install the extension from the the [VS Code marketplace](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode). 