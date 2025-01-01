---
title: Create Data Source Plugin
description: Walkthrough on how to create a data source plugin for Evidence
sidebar_position: 4
---

To see a working example of a data source plugin, the [Evidence postgres source plugin](https://github.com/evidence-dev/evidence/tree/main/packages/datasources/postgres) is a good
reference.

## Get started
To get started, go to [the data source template repo](https://github.com/evidence-dev/datasource-template) and click to "Use This Template". Then, follow the directions in the `README` in that repo.

## Options Specification

Evidence Datasources must provide an `options` export; this is used to
build UI and validation to ensure an excellent UX for Evidence users.

Options can have the following fields:

<PropListing
    name="title"
    type="string"
    required
>

Name or Title of the option

</PropListing>
<PropListing
    name="type"
    type={['string', 'number', 'boolean', 'select', 'file']}
    required
>

Control to show

</PropListing>
<PropListing
    name="secret"
    type="boolean"
>

Secret values are placed in `connection.options.yaml`, which is not source controlled

</PropListing>
<PropListing
    name="shown"
    type="boolean"
>

Displays value in UI elements (e.g. for usernames, that should not be source controlled but are not 'secret'. Otherwise the field will display as ∙∙∙)

</PropListing>
<PropListing
    name="virtual"
    type="boolean"
>

Disables saving a field, useful for credential files

</PropListing>
<PropListing
    name="references"
    type="string"
>

Indicates that the field should get its value from another field if it is available, useful for credential files. Formatted as a [json path](https://www.npmjs.com/package/@astronautlabs/jsonpath)

</PropListing>
<PropListing
    name="forceReference"
    type="boolean"
>

If true, the input is disabled and the value can only come from a reference

</PropListing>
<PropListing
    name="fileFormat"
    type={['json', 'yaml']}
>

If `type` is `file`, set how it should be parsed. It will then be available to `references`

</PropListing>
<PropListing
    name="description"
    type="string"
>

Description of the option, shown as a hint in UI

</PropListing>
<PropListing
    name="children"
    type="Record<string|number|boolean, Options>"
>

See [children](#children)

</PropListing>
<PropListing
    name="required"
    type="boolean"
>

Indicates that the user must provide this option

</PropListing>
<PropListing
    name="options"
    type="Array<{`{label: string, value:string}`}>"
>

Available options for `select` type

</PropListing>
<PropListing
    name="nest"
    type="boolean"
>

Determines behavior of `children`

</PropListing>
<PropListing
    name="default"
    type={['string', 'number', 'boolean']}
>

Default Value

</PropListing>


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
