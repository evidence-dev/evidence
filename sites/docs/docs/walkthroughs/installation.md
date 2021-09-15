---
sidebar_position: 1
---

# Installation
Don't worry if this is your first time using any of the tools referenced in this walkthrough - we will guide you through all the steps. If you need help, [send us a message on Slack.](/community) We're here for you! 

## System Requirements 

**Mac OSX ** 

Evidence is very new, and Windows users have been running into issues. 

Great Windows support is a priority for us. If you'd like to be notified when we've resolved these issues, you can **[sign up for mailing list](http://eepurl.com/htt4ob)**


## IDE or Text Editor
You will need an IDE (integrated development environment) or text editor to work with Evidence. We like [VSCode (Visual Studio Code)](https://code.visualstudio.com/) because of its layout, integrated console/terminal, and extension library.

![VSCode](/img/vscode_ui.png)

VSCode has an extensive documentation site which you can find at this link:
https://code.visualstudio.com/docs

## Terminal
The rest of this walkthrough will be done through a terminal. You can either use your own terminal, or open one directly in your IDE.

If you are using VSCode, the shortcut to open a new terminal is

`Ctrl` + `` ` ``

## Node.js & npm
You will need to install Evidence from **npm (Node Package Manager)**, which is a source of JavaScript packages. Npm requires you to have **Node.js**, which is a "JavaScript runtime environment" - that just means it's software that gets used to execute an application once it's live (in the case of Node.js, it lets you execute JavaScript code outside of a web browser).

There are several ways to install both Node.js and npm and it can be quite confusing to search through the alternatives. Our recommendation is to use **nvm (Node Version Manager)** - this is a package you download that will help you install Node.js and npm, and makes it easier to manage/change versions.

When installing packages, if you are ever presented with an option to download a "stable" or "supported" version vs. a "current" version, you should choose the stable version because it has been released for some time and the package creator has worked through a lot of the issues/bugs with it. Current or newest versions often contain features that are still in development or haven't been fully vetted.

Below are the versions of Node.js and npm you will need to install Evidence:

**Node Version 14.17.6** 

`14.17.6` is the most recent stable version of Node as at the time this was written. Should this page ever be out of date, check the [Node.js website](https://nodejs.org/en/) to see ther version number listed as **LTS (long-term support)**.

Check which version you have with `node -v` 

**NPM Version 6 or greater** 

Check which version you have with `npm -v` 

### Install nvm
Run the following commands in your terminal to install nvm. This will download and run an install script from the nvm GitHub repo:
```shell
touch ~/.bash_profile
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

Run the command below to check that nvm was successfully installed (if the command runs and returns a version number, it's been installed):
```shell
nvm --version
```

### Check available versions
```shell
nvm ls-remote
```
This will print a list to your console of all available Node.js versions. If you're switching versions, you should find the largest version number listed as **LTS (Long-term support)**. Typically there will be a stable version and a "current" version listed. The current version is in development now and may not work with Evidence. 

### Install a version
Take the version number you found in the previous step and include it in the command below. This will install Node.js and npm at the same time:
```shell
nvm install 14.17.6
```

### Check your installed versions
If you are unsure which version of Node.js or npm you have, you can run the following commands in your terminal:

```shell
node -v
```

```shell
npm -v
```

`-v` means **version**. You can use this command to check versions of any package you have installed. If your npm version number is under 6, you can update npm with the following command:

### Change Versions
Nvm makes it easy to switch between different versions.

Switch between versions using the command below. When you switch Node.js versions, it will automatically change your npm version to match.
```shell
nvm use 14.17.6
```

Once you have the right Node.js and npm versions installed, you're ready to create your Evidence project!

:::note Help us improve the docs
If any of the steps above are out of date, you can check out the npm website for current details:
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

Please let us know if any of these steps don't work so we can update these docs and help others who will run into the same issues! You can let us know [on Slack](/community) or by emailing <support@evidence.dev>.
:::

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

That's it for installation - now you can start your server and use Evidence.

## Start the Development Server
Since you are working with Evidence in development mode, you'll be using a development server which runs on your local computer. This server watches for changes in your markdown documents, and quickly translates them into updated pages in your project. 

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

## Using a Different Port
You may need to run your Evidence project on a different port (for example, if you have other programs running and port 3000 is already occupied). If you need to run your Evidence project on a different port than 3000, follow the steps below:

1. Open the `package.json` file in the root of your project. This file provides a list of instructions for your project, including which scripts to use to run various commands, as well as which versions of packages are needed to run the project
2. Under **scripts**, look at the **dev** line. This is the script your project will use in the background when you run the `npm run dev` command in your terminal. By default, this script uses port 3000
3. Add `--port XXXX` after `svelte-kit dev`, where `XXXX` is the port number you'd like to use. This will override the port used when running the dev server

The new **dev** line should look like this:
```json
"dev": "svelte-kit dev --port XXXX",
```

**Example (using port 8080):**
![custom-port](/img/custom-port.png)

## In Review 

We've run the following four commands in our terminal, and we should have a working Evidence site visible in our web browser at `localhost:3000`. 

```shell
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```

## Next Steps
Now that you're all set up, you can keep working through the getting started guide. The next step is to [take a look at the files in your new project.](/getting-started/project-structure)

## Help
If you need help with any of this, [reach out to us on Slack](/community).