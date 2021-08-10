---
sidebar_position: 1
---

# Installation
Don't worry if this is your first time using any of the tools referenced in this walkthrough - we will guide you through all the steps. If you need help, [send us a message on Slack.](/community)

## IDE or Text Editor
You will need an IDE (integrated development environment) or text editor to work with Evidence. We like [VSCode (Visual Studio Code)](https://code.visualstudio.com/) because of its layout, integrated console/terminal, and extension library.

![VSCode](/img/vscode_ui.png)

VSCode has an extensive documentation site which you can find at this link:
https://code.visualstudio.com/docs

## Terminal
The rest of this walkthrough will be done through a terminal. You can either use your own terminal, or open one directly in your IDE.

If you are using VSCode, the shortcut to open a new terminal is

`Ctrl` + `` ` ``

## npm
You will need to install Evidence from **npm (Node Package Manager)**, which is a source of JavaScript packages. To install Evidence, you need version 6 or above (see below for how to check or update your version).

### Install npm
To install npm, follow the documentation on the npm website:
https://www.npmjs.com/get-npm

### Check or Update Version
If you are unsure which version of npm you have, you can run the following command in your terminal:

```shell
npm -v
```

`-v` means **version**. You can use this command to check versions of any package you have installed. If your npm version number is under 6, you can update npm with the following command:

```shell
npm update -g
```

`-g` here means **global** - this will update your version of npm wherever it is used locally (rather than only in your current project).


## Create Evidence Project
`init` is a command to **initialize** a project (i.e. create it) and fill it with the files you will need to get started.

This command is used to initialize Evidence:
```shell
npm init @evidence-dev/new my-project
```

`@` is a **scope** symbol in npm. This means we are trying to set up a package that is part of a larger group or organization (the package is "scoped" to that organization). 

In this case:
* `@evidence-dev` is the organization
* `new` is the package

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

Now we can run the installation step:

```shell
npm install
```

npm will add all dependencies to the `node_modules` folder in your project.

That's it for installation - now you can start your server and use Evidence.

## Start the Development Server
To view pages in a browser, you need a **server**. The server takes files we create and sends them to the browser to be rendered and displayed. It also responds to events on the webpage when new files or images are needed. 

Since you are working with Evidence in development mode, you'll be using a development server which runs on your local computer.

Use the command below in your terminal to start the dev server:
```shell
npm run dev
```
To stop the dev server, use `Ctrl` + `C`

When the dev server is running, you will be able to see your pages in your browser at [localhost:3000](http://localhost:3000)

![hello-world](/img/hello-world-gradient.png)

## Localhost
If you have not tried web development before, `localhost:3000` may look foreign to you. This is your **URL** for local web development and tells your browser where to send requests. You can think of it in the same way as a normal URL like `google.com`.

Entering `localhost:3000` in your browser tells your browser to send a request to the local server which is using port 3000. If your development server is running, it will receive that request and send back the files needed to display your webpage.

On your Evidence page, if you click the [Querying Data](http://localhost:3000/firstquery) link, you'll see the name of the page appended to the URL, just as you would see on a normal website: `localhost:3000/firstquery`

## Next Steps
Now that you're all set up, [take a look at the files in your new project.](/getting-started/project-structure)

## Help
If you need help with any of this, [reach out to us on Slack](/community).