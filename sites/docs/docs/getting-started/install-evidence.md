---
sidebar_position: 2
hide_table_of_contents: false
---

# Install Evidence

If you're not familiar with the terminal or you run into trouble, check out the [Detailed Installation Walkthrough.](/walkthroughs/installation)

## Install
Create a new Evidence project by following the steps below, then open your browser and go to [localhost:3000](http://localhost:3000)

```shell
npx degit evidence-dev/template my-project
cd my-project 
npm install 
npm run dev 
```

Check the System Requirements below to ensure you have the right pre-requisites.

## System Requirements 

:::caution Node version issue
Some users have been running into an issue that causes 500 errors when running their project on the dev server. This is caused by using a different version of Node than the one specified below during the installation process. If you encounter this error, the easiest solution is to change your version of Node and install a new Evidence project. If you need help changing versions, see our [Detailed Installation Walkthrough.](/walkthroughs/installation)
:::

**Node Version 14.17.6** 

`14.17.6` is the most recent stable version of Node as at the time this was written. Should this page ever be out of date, check the [Node.js website](https://nodejs.org/en/) to see ther version number listed as **LTS (long-term support)**.

Check which version you have with `node -v` 

**NPM Version 6 or greater** 

Check which version you have with `npm -v` 

**Mac OSX ** 

Evidence is very new, and Windows users have been running into issues. 

Great Windows support is a priority for us. If you'd like to be notified when we've resolved these issues, you can **[sign up for mailing list](http://eepurl.com/htt4ob)**


<div style={{textAlign: 'center'}}>

![home-screen-initial](/img/hello-world-gradient.png)

</div>