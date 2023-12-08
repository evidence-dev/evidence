# Developing Plugins 

Evidence includes a plugin system which can be used to add components and data sources to your project. 

# Creating a component plugin 

## Starting from a Template

The easiest way to get started is from the example component library [**on GitHub**](https://github.com/evidence-dev/labs), with a live demo of the components [here](https://labs.evidence.dev).

## Exporting Components

There are 2 ways to expose components to Evidence, `evidence.manifest.yaml`, and module exports.
For both methods, you must re-export the components in your `index.js` file, and they must
have the same export name as the svelte file name. (e.g. `MyComponent.svelte` must be exported as `MyComponent`)

### Module Exports

When writing a plugin from scratch, this is the preferred method.
To indicate that a component should be available in Evidence implicitly (e.g. without imports),
add the following to your component:

```html
<script context="module">
    export const evidenceInclude = true;
</script>
```

### Manifest

If you would prefer not to flag your components, you can also maintain a `evidence.manifest.yaml` file.
The structure of the file is a single array of component names:

```yaml
components:
    - ComponentOne
    - ComponentTwo
```

# Creating a Data Source Plugin 

The [Evidence postgres source plugin](https://github.com/evidence-dev/evidence/tree/main/packages/postgres) is a good reference for a source plugin. 

Data source plugins are npm packages which export the following: 

1. `options` object which enumerates the credentials required to establish a connection to the data source. These will be used to construct the connection UI for users who are using the plugin
1. `runQuery` function which executes queries and returns an array of results 
1. `getRunner` function which can iterate over files in a sources directory (e.g. `.sql` files) and return the required query string for the 
1. `testConnection` function which executes a test query

In order to indicate to the Evidence plugin system that the package contains a data source (and what it should be called in the UI), add the following to the `package.json`: 

```
	"evidence": {
		"databases": [
			[
                db-alias-1,
                db-alias-2, 
                etc.  
			],
		],
		"icon": "Postgresql"
	}

```
