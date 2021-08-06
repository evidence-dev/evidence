---
sidebar_position: 2
---

# Create a Page

## Create a markdown page
In the `src/pages` directory, create a new directory (folder) called `austin-311` and create a new page in that directory called `index.md`.

![austin-files](/img/austin-files.png)

In `index.md`, add a header, introduction, and sections to your page. Copy and paste the text below into your file.

```markdown title="src/pages/austin-311/index.md"
# Austin 311 Complaints Summary

The analysis below investigates the frequency and nature of 311 calls in Austin, TX.

## Complaints by Day

### Summary

### Daily Chart

## Complaints by Department
```

## Add a navigation link to your page
Open the `__layout.svelte` file to edit the navigation sections and find the code below:
```json title="src/pages/__layout.svelte"
    <Nav
		sections = {[
			{href:"/", label: "Home"},
			{href:"/example", label: "Example"}
		]}
	/>
```

Add another section for `austin-311` and save the file:

```json {5} title="src/pages/__layout.svelte"
    <Nav
		sections = {[
			{href:"/", label: "Home"},
			{href:"/example", label: "Example"},
            {href:"/austin-311", label: "Austin 311"}
		]}
	/>
```

Go back to your browser and refresh the page if necessary. You should now be able to navigate to your new page, which should look like this:

<div style={{textAlign: 'center'}}>

![first-additions](/img/add-a-page.png)

</div>
