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

### System Requirements 

**NPM Version 7 or greater** 

Check which version you have with `npm -v` 

Install the latest version with `npm install -g npm@latest`

<div style={{textAlign: 'center'}}>

![home-screen-initial](/img/hello-world-gradient.png)

</div>


## VS Code Extension
Install the Evidence VS Code extension to enable syntax highlighting and basic autocomplete. You can install the extension in 2 ways:
1. In VS Code, search for "Evidence" in the Extensions menu and click to install

    ![extension-menu](/img/extensions-menu-search.png)

1. Install from the the [VS Code Marketplace webpage](https://marketplace.visualstudio.com/items?itemName=Evidence.evidence-vscode)

See [VS Code Extension](/vscode-extension) for more information about the extension.


## Optional

### Using a Different Port
If you need to run your Evidence project on a different port than 3000, follow the steps below:

1. Open the `package.json` file in the root of your project
2. Under **scripts**, look at the **dev** line
3. Add `--port XXXX` after `svelte-kit dev`, where `XXXX` is the port number you'd like to use

The new **dev** line should look like this:
```json
"dev": "svelte-kit dev --port XXXX",
```

**Example (using port 8080):**

![custom-port](/img/custom-port.png)


### Using Mobile Device in Dev Mode

#### Expose Server to Your Network
If you would like to test your Evidence project on other devices while in dev mode, you can expose your dev server to your network. This will generate a web address for you, which you can use to see your project on mobile devices.

:::caution Trusted Network
Only expose your server to your network if it is a trusted network. Treat this as a temporary setting, especially if you frequently use networks outside of your office or home. 
:::

1. Open the `package.json` file in the root of your project
2. Under **scripts**, look at the **dev** line
3. Add `--host 0.0.0.0` after `svelte-kit dev`

The new **dev** line should look like this:
```json
"dev": "svelte-kit dev --host 0.0.0.0",
```

The network address to use on your mobile device will appear in your console after running your dev server:
![network](/img/network.png)

Note the warning about directories being accessible to anyone on your network.

Open the network address on your mobile device and you should see your Evidence project:

![mobile-screenshots-small](/img/mobile-screenshots-small.png)
