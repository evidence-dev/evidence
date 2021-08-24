---
sidebar_position: 2
hide_table_of_contents: false
---

# Install Evidence

:::info Known issue for PC Users
PC users will not be able to successfully install Evidence because of a known issue, which we will be resolving in the coming weeks. 

Please sign up for our mailing list to receive an update when we release support for PCs:
**[Sign Up for Mailing List](http://eepurl.com/htt4ob)**
:::

If you're not familiar with the terminal or you run into trouble, check out the [Detailed Installation Walkthrough.](/walkthroughs/installation) Otherwise, get started below.

Install Evidence from npm using the commands below in your terminal:

:::note NPM Version 6+ Required
Check your version with `npm -v`<br/>
If needed, update with `npm update -g`
:::

```shell
npx degit evidence-dev/template my-new-project
cd my-new-project 
npm install 
npm run dev
```

Follow the setup steps in your terminal to complete the installation. Then open your browser and go to [localhost:3000](http://localhost:3000)

<div style={{textAlign: 'center'}}>

![home-screen-initial](/img/hello-world-gradient.png)

</div>

:::note Unstyled Content    
If your page shows unstyled content, just refresh your browser. This is a known issue in development mode.
:::





