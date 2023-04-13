---
sidebar_position: 1
title: Installation
---

If you need help, [send us a message on Slack.](/community) We're here to help!

## IDE or Text Editor

You will need an IDE (integrated development environment) or text editor to work with Evidence. We like [VSCode (Visual Studio Code)](https://code.visualstudio.com/) because of its layout, integrated console/terminal, and extension library.

VSCode has an extensive documentation site which you can find at this link:
https://code.visualstudio.com/docs

## Terminal

The rest of this walkthrough will be done through a terminal. You can either use your own terminal, or open one directly in your IDE.

If you are using VSCode, the shortcut to open a new terminal is

`Ctrl` + `` ` ``

## System Requirements

Before installing Evidence, you will need to make sure you have the following installed on your computer:

#### Node.js (v16 or higher)

Type the following command into your terminal:

```shell
node -v
```

`-v` means **version**.

If you see a version less than 16 or if you don't see a version number returned from that command, you will need to install Node.js. Choose the "LTS" option (long-term support).

#### NPM (v7 or higher)

If you downloaded Node.js, you will have npm installed (it's included with the Node.js installation).

Run this command to check your npm version:

```shell
npm -v
```

If your npm version number is under 7, you can update npm with the following command:

```shell
npm install -g npm@latest
```

<a class="external" href="https://nodejs.org/en/download">Download Node.js + NPM</a>
<br/><br/>

Once you have the right Node.js and npm versions installed, you're ready to create your Evidence project!

## Create an Evidence Project

`npx degit` is a command to download the code from a github repository. This is going to download our template project and place it into a directory called 'my-project'.

```shell
npx degit evidence-dev/template my-project
```

`my-project` is the name of the directory that will be created on your computer. You can change this name to whatever you'd like.

After this step, you will have the files you need (they will be in the `my-project` folder that was created). The next step is to install any required packages or dependencies in those files.

## Install Dependencies

You will need to run an installation on your new directory using the `install` command in npm. This will identify and download any dependencies from the files in the Evidence package.

For example, Evidence utilizes other npm packages and will require specific versions of those packages - npm handles all of this for you.

The command will work on whichever directory you are in when you run it, so navigate to your new directory:

```shell
cd my-project
```

`cd` means **change directory** - we are telling the terminal to go into the my-project directory.

Now that we are in our project, we can run the installation step:

```shell
npm install
```

npm will add all dependencies to the `node_modules` folder in your project.

## Install the VS Code Extension

The Evidence VS Code extension enables syntax highlighting and basic autocomplete. You can install the extension in 2 ways:

1. In VS Code, search for "Evidence" in the Extensions menu and click to install

   ![extension-menu](/img/extensions-menu-search.png)

1. Install from the the [VS Code Marketplace webpage](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode)

The VS Code extension is not required to build an Evidence project, but it makes the experience of writing your project smoother.

That's it for installation - now you can start your server and use Evidence.

## Start the Development Server

Since you are working with Evidence in development mode, you'll be using a development server which runs on your local computer. This server watches for changes in your markdown documents, and quickly translates them into updated pages in your project.

Use the command below in your terminal to start the dev server:

```shell
npm run dev
```

To stop the dev server, use `Ctrl` + `C`

When the dev server is running, you will be able to see your pages in your browser at [localhost:3000](http://localhost:3000)

### Localhost

If you have not tried web development before, `localhost:3000` may look foreign to you. This is your **URL** for local web development and tells your browser where to send requests. You can think of it in the same way as a normal URL like `google.com`.

Entering `localhost:3000` in your browser tells your browser to send a request to the local server which is using port 3000. If your development server is running, it will receive that request and send back the files needed to display your webpage.

If you navigate to a page in your Evidence project and look at the URL, you will see that each page in Evidence corresponds to a URL (e.g., `localhost:3000/examples`).

### Development Server Options

You can change how the dev server runs by adding command line interface (CLI) "arguments". Add `--` followed by the arguments you need:

```shell
npm run dev -- --[setting] [option]
```

Evidence uses Vite, and supports the same options - see [Vite CLI Options](https://vitejs.dev/guide/cli.html#cli-options) supports.

#### Run using an alternative port

```shell
npm run dev -- --port 4000
```

#### Run from an alternative host

```shell
npm run dev -- --host 0.0.0.0
```

## In Review

We've run the following four commands in our terminal, and we should have a working Evidence site visible in our web browser at `localhost:3000`.

```shell
npx degit evidence-dev/template my-project
cd my-project
npm install
npm run dev
```

## Next Steps

Now that you're all set up, you can keep working through the getting started guide. The next step is to [connect your database.](/core-concepts/data-sources)

## Help

If you need help with any of this, [reach out to us on Slack](/community).

:::note Help us improve the docs
Please let us know if any of these steps don't work so we can update these docs and help others who will run into the same issues. You can let us know [on Slack](/community) or by emailing <support@evidence.dev>.
:::
