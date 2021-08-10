---
sidebar_position: 8
---

# Add a Loop

Now we'll use the `complaints_by_department` query to demonstrate how to loop through a dataset. 

Loops are achieved through an **`each block`**.

## Set up department looop
Let's use an each block to list the names of all the departments.

```json title="Add to bottom of austin-311/index.md:"
{#each data.complaints_by_department as cbdept}

{cbdept.department}

{/each}
```
#### How does this work? 
In the each block, we're passing in the query name `data.complaints_by_department` and giving it an "alias" of `cbdept` to make it easier to reference inside the each block.

The each block loops through every row of the table and displays whatever is included in the middle of the block. In this case, we're displaying the `department` column of the `cbdept` dataset.

<div style={{textAlign: 'center'}}>

![dept-list](/img/department-name-list.png)

</div>

## Add value for each department
Now we're going to add the number of complaints for each department.

We'll use a `<Value/>` component for this. You could do this with a bare reference as we did with the department name, but that would not format the values for you.

When used inside an **each block**, the `<Value/>` component only requires a reference to the column it needs to display.

Let's also make this a bullet list by adding a `*` in front of our data (normal markdown syntax).

```json {3} title="Change the highlighted line below:"
{#each data.complaints_by_department as cbdept}

* {cbdept.department}: <Value value={cbdept.complaints}/>

{/each}
```
<div style={{textAlign: 'center'}}>

![dept_name_numbers](/img/department-values.png)

</div>

It's powerful to be able to loop through a dataset and display whatever you'd like for each row. 

What if you want to drill into each item in the list and get more information about it? That would be too much information to display in one list, wouldn't it?

The best way to contain all of that department-specific information would be to create a page for each department, showing only stats relevant to the department you select.

Let's set up a link for each department to allow our users to visit a page for whichever departments they're interested in.

## Add links to department pages
You can create a link in markdown by wrapping your link label in square brackets, then putting a URL in parentheses directly after it: `[Link Label](URL)`

This code will loop through the department list and add a URL containing a department directory `austin-311/department` and the department name `{cbdept.department}`. 

For example, the URL for the Transportation department would be `localhost:3000/austin-311/department/Transportation`.

```markdown {3} title="Change the highlighted line below:" 
{#each data.complaints_by_department as cbdept}

* [{cbdept.department}](/austin-311/department/{cbdept.department}): <Value value={cbdept.complaints} />

{/each}
```
<div style={{textAlign: 'center'}}>

![dept-links](/img/department-links.png)

</div>

Looking good, but we have one big problem: we don't have any of these department pages built yet, so these links are going to give us errors.

## Now what?
We have 19 departments in our list - are we really going to create 19 documents?

This is a common issue in analytics and reporting in large organizations: we have a lot of things to report on, but no good way to summarize all of the information while also giving users the ability to drill-down into specific areas of interest. 

BI tools claim to have this functionality, but the readers of our reports don't want to spend time clicking and dragging inside a report builder.

**With Evidence, there's a better way.** 

We can deliver all the detail of a drill-down report without a ton of work.

In the next section, we'll show you how to use **parameterized pages** to make these links work - opening up almost limitless possibilities for designing drill-down reporting.