---
title: Create Data Source Plugin
description: Walkthrough on how to create a data source plugin for Evidence
sidebar_position: 4
---

To see a working example of a data source plugin, the [Evidence postgres source plugin](https://github.com/evidence-dev/evidence/tree/main/packages/postgres) is a good
reference.

## Get started
To get started, go to [the data source template repo](https://github.com/evidence-dev/datasource-template) and click to "Use This Template". Then, follow the directions in the `README` in that repo.

## Options Specification

Evidence Datasources must provide an `options` export; this is used to
build UI and validation to ensure an excellent UX for Evidence users.

Options can have the following fields:

<PropListing
    name=title
    type=string
    required
    description="Name or Title of the option"
/>
<PropListing
    name=type
    type={['string', 'number', 'boolean', 'select', 'file']}
    required
    description="Control to show"
/>
<PropListing
    name=secret
    type=boolean
    
    description="Secret values are placed in <code class=markdown>connection.options.yaml</code>, which is not source controlled"
/>
<PropListing
    name=shown
    type=boolean
    
    description="Displays value in UI elements (e.g. for usernames, that should not be source controlled but are not 'secret'. Otherwise the field will display as ∙∙∙)"
/>
<PropListing
    name=virtual
    type=boolean
    
    description="Disables saving a field, useful for credential files"
/>
<PropListing
    name=references
    type=string
    
    description="Indicates that the field should get its value from another field if it is available, useful for credential files. Formatted as a <a href='https://www.npmjs.com/package/@astronautlabs/jsonpath' class=markdown>json path</a>"
/>
<PropListing
    name=forceReference
    type=boolean
    
    description="If true, the input is disabled and the value can only come from a reference"
/>
<PropListing
    name=fileFormat
    type={['json', 'yaml']}
    
    description="If <code class=markdown>type</code> is <code class=markdown>file</code>, set how it should be parsed. It will then be available to <code class=markdown>references</code>"
/>
<PropListing
    name=description
    type=string
    
    description="Description of the option, shown as a hint in UI"
/>
<PropListing
    name=children
    type="Record<string\|number\|boolean, Options>"
    
    description="See <a href='#children' class=markdown>children</a>"
/>
<PropListing
    name=required
    type=boolean
    
    description="Indicates that the user must provide this option"
/>
<PropListing
    name=options
    type="Array<{`{label: string, value:string}`}>"
    
    description="Available options for <code class=markdown>select</code> type"
/>
<PropListing
    name=nest
    type=boolean
    
    description="Determines behavior of <code class=markdown>children</code>"
/>
<PropListing
    name=default
    type={['string', 'number', 'boolean']}
    
    description="Default Value"
/>



### Children

Many datasources have variable configuration (e.g. if ssl is enabled for postgres, then an ssl mode can be selected), and Evidence
options support this workflow.

Consider this partial postgres ssl option:

```javascript
ssl: {
    type: 'boolean',
    // ...
    nest: true,
    children: {
        [true]: {
            sslmode: {
                // ...
            }
        }
    }
},
```

`ssl.children` is a record of possible values to an additional set of options that are exposed then the values match.
In this example, the `sslmode` option is only displayed when `ssl` is true.

The resulting type of this option is:
```typescript
{ ssl: false } | { ssl: { sslmode: string } }
```

In cases where you want a flat object, rather than a nested object; set `nest` to false.

This would produce

```typescript
{ ssl: false } | { ssl: true, sslmode: string }
```

## Promoting Your Plugin
If you are building a plugin for other Evidence users, [let us know in Slack](https://slack.evidence.dev) and we can share it with the community.