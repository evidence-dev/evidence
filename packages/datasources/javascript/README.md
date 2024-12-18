# Evidence JavaScript Source Plugin

This is a JavaScript source for Evidence. It allows you to run arbitrary JavaScript code as a data source. It's a quick way to get data into Evidence without having to create a new connector.

1. Launch the development server with `npm run dev` and navigate to the settings menu (localhost:3000/settings) to add a data source using this plugin.
2. Create a new source in the sources directory with a .js file like `pokedex.js`. The JS file should export a `data` object.

   ```javascript
   let url = 'https://pokeapi.co/api/v2/pokemon/';

   const response = await fetch(url);
   const json = await response.json();
   const data = json.results;

   export { data };
   ```

3. You can then reference your data in markdown queries.

   ````markdown
   ```sql pokedex
   select * from pokedex
   ```
   ````

## Credentials

You can pass credentials via environment variables to your JS file. They must be prefixed with `EVIDENCE_`.

```javascript
let key = process.env.EVIDENCE_API_KEY;
let url = 'https://whatever.com/api';

const response = await fetch(url, {
	headers: {
		'x-api-key': key
	}
});

const json = await response.json();
const data = json.results;

export { data };
```

## JavaScript Type Support

| Type    | Supported |
| ------- | --------- |
| String  | Yes       |
| Number  | Yes       |
| Boolean | Yes       |
| Date    | Yes       |
| Array   | Partial\* |
| Object  | No\*\*    |

\*Arrays are converted to strings. eg `[1, 2, 3]` &rarr; `"1,2,3"`

\*\*Objects will display as `[object Object]` in Evidence. You should convert objects to other types in your JavaScript file.
