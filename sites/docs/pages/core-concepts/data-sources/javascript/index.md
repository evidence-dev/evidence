---
title: JavaScript
description: Connect Evidence to APIs using JavaScript
sidebar_link: false
---

JavaScript is a general-purpose programming language that is widely used for web development. For developers familar with Python, simple JavaScript data sources should be very accessible.

Evidence supports JavaScript data sources, which allow you to connect to APIs, transform and load data into Evidence using JavaScript.

<NewSource sourceName="JavaScript" />

Then, add a .js file to the sources/[your_source_name]/ folder. The file must export an object named `data`:


`sources/[your_source_name]/pokedex.js`
```javascript
let url = 'https://pokeapi.co/api/v2/pokemon/';

const response = await fetch(url);
const json = await response.json();
const data = json.results;

// Export the data object
export { data };
```

## Configuration

If connecting to an API, you will likely need to add an API key or some other form of authentication.

### Credentials

Most APIs require some form of authentication. Evidence supports passing credentials via environment variables to your JS file. They must be prefixed with EVIDENCE_.

You can pass credentials via environment variables to your JS file. They must be prefixed with EVIDENCE_.

In your local environment, you can set these variables in the .env file.

For production, you will need to add these variables to your build environment.

```yaml
EVIDENCE_API_KEY=1234567890
```


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

### JavaScript Type Support

| Type    | Supported |
| ------- | --------- |
| String  | Yes       |
| Number  | Yes       |
| Boolean | Yes       |
| Date    | Yes       |
| Array   | Partial\* |
| Object  | No\*\*    |

\*Arrays are converted to strings. eg `[1, 2, 3]` &rarr; `"1,2,3"`