---
sidebar_position: 3
title: Version Control
---

We recommend setting up a git repository to track and manage changes to your Evidence project. You'll also need this to deploy your project online using our deployment instructions.

You can check if you have a published repo in the Settings page of your Evidence project ([localhost:3000/settings](http://localhost:3000/settings))

## Initializing & Publishing a Repo

### Through VS Code

If you use VS Code, the easiest way to get set up with version control is through the Source Control tab in your editor. You can initialize and publish your git repo from this tab.

![vscode-git](/img/vscode-git.png)

If you need more information, VS Code has a [guide for setting up version control](https://code.visualstudio.com/docs/editor/versioncontrol#_initialize-a-repository) in their docs.

### Through GitHub

GitHub provides a [guide in their docs](https://docs.github.com/en/get-started/importing-your-projects-to-github/importing-source-code-to-github/adding-locally-hosted-code-to-github#adding-a-local-repository-to-github-using-git) for getting a local project into a git repository and published to GitHub.

### Through the Command Line

You can initialize a local git repo for your project through the command line by:

1. Changing your current directory to your local Evidence project
2. Running `git init` in your terminal

This will give you a local git repo which you can use to manage changes to your project's code. 

You'll still need to publish your repo to a platform like GitHub in order to use our deployment instructions. See the two sections above for help with publishing.




