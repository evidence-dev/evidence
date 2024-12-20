---
title: Tabs
sidebar_position: 1
---

<DocTab>
  <div slot='preview'>
    <Tabs>
        <Tab label="First Tab">
            Content of the First Tab

            You can use **markdown** here too!
        </Tab>
        <Tab label="Second Tab">
            Content of the Second Tab

            Here's a [link](https://www.google.com)
        </Tab>
    </Tabs>
  </div>

```markdown
<Tabs>
    <Tab label="First Tab">
        Content of the First Tab

        You can use **markdown** here too!
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab

        Here's a [link](https://www.google.com)
    </Tab>
</Tabs>
```
</DocTab>




## Examples

### Full Width

<DocTab>
  <div slot='preview'>
    <Tabs fullWidth=true>
        <Tab label="First Tab">
            Content of the First Tab
        </Tab>
        <Tab label="Second Tab">
            Content of the Second Tab
        </Tab>
    </Tabs>
  </div>

```markdown
<Tabs fullWidth=true>
    <Tab label="First Tab">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>
```
</DocTab>


### Custom Color

<DocTab>
  <div slot='preview'>
    <Tabs color=#ff0000>
        <Tab label="Red Tabs">
            Content of the First Tab
        </Tab>
        <Tab label="Second Tab">
            Content of the Second Tab
        </Tab>
    </Tabs>
  </div>

```markdown
<Tabs color=#ff0000>
    <Tab label="Red Tabs">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>
```
</DocTab>

### Background Color

<DocTab>
  <div slot='preview'>
    <Tabs background=true>
        <Tab label="First Tab">
            Content of the First Tab
        </Tab>
        <Tab label="Second Tab">
            Content of the Second Tab
        </Tab>
    </Tabs>
  </div>

```markdown
<Tabs background=true>
    <Tab label="First Tab">
        Content of the First Tab
    </Tab>
    <Tab label="Second Tab">
        Content of the Second Tab
    </Tab>
</Tabs>
```
</DocTab>


### Persist Selected Tab to URL

<DocTab>
  <div slot='preview'>
    <Tabs id="example-tab">
        <Tab label="One">
            Click Second id Tab and notice the the url updates!
        </Tab>
        <Tab label="Two">
            Refresh the page and the tab you selected persists!
        </Tab>
    </Tabs>
  </div>

```markdown
<Tabs id="example-tab">
    <Tab label="One">
        Click Second id Tab and notice the the url updates!
    </Tab>
    <Tab label="Two">
        Refresh the page and the tab you selected persists!
    </Tab>
</Tabs>
```
</DocTab>

# Tabs

## Options

<PropListing
    name="id"
    options="string"
>

Unique Id for this set of tabs. When set, the selected tab is included in the URL so it can be shared.

</PropListing>
<PropListing
    name="color"
    options="Any valid hex, rgb, or hsl string"
    defaultValue="blue"
>

Color for the active tab.

</PropListing>
<PropListing
    name="fullWidth"
    options={[true, false]}
    defaultValue="false"
>

Tabs take up full width of page

</PropListing>
<PropListing
    name="background"
    options={[true, false]}
    defaultValue="false"
>

Include background color on active tab. Color is automatically determined based on `color` prop

</PropListing>

# Tab

## Options

<PropListing
    name="label"
    required
>

Label for the tab

</PropListing>
<PropListing
    name="id"
>

Unique Id for this tab. Only needed if 2 tabs have the same label (not recommended).

</PropListing>