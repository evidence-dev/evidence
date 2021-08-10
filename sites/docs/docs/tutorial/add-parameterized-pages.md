---
sidebar_position: 9
---

# Add Parameterized Pages
Parameterized pages allow you to programmatically create webpages using your data. 

Evidence takes a parameter you supply through a URL and uses it to populate a template markdown file, allowing you to create one page that can display data for many objects.

In our example, we are going to create parameterized pages for departments, so you can display data for any department from our list on its own page without having to create unique files.

## Set up a department directory 
Create a `department` folder in `src/pages/austin-311` and create the two .md files shown below:

![dept_directory](/img/dept_directory.png)

* Square brackets indicate a parameterized template file
* You can navigate to [localhost:3000/austin-311/department](http://localhost:3000/austin-311/department) to test the new URL (but you will need content in the directory for anything to be displayed)
* If a valid parameter is supplied in the URL, Evidence will run the template file and populate it based on the parameter
* If no parameter is specified in the URL, Evidence will use `index.md` if it is in the directory

## Add the code below to [department].md
We'll explain how this code works in a minute - for now, paste this into your file to get it working.

````markdown title="src/pages/austin-311/department/[department].md"
# {$page.params.department}

```complaints_by_department
select owning_department as department,
count(*) as complaints
from `bigquery-public-data.austin_311.311_service_requests` 

group by department
order by complaints DESC
```

```complaints_by_day_department
select
owning_department as department,
extract(date from created_date) as date, 
count(*) as complaints 

from `bigquery-public-data.austin_311.311_service_requests` 
 
group by department, date 
order by date desc
```

<Value data={data.complaints_by_department.filter(d => d.department === $page.params.department)} column=complaints/> complaints.

<LineChart data={data.complaints_by_day_department.filter(d => d.department === $page.params.department)} x=date y=complaints/>
````

## How the Template Code Works
### Access the Parameter
This variable accesses the parameter included in the URL:

```markdown
{$page.params.department}
```

* For example, if the URL ends in `/department/Transportation`, this variable will show "Transportation"
* This variable is used in the header of the template page

### Filter Queries with the Parameter
Queries are included as normal in template files, but the results are **filtered** from within Evidence components.

You can apply a filter to a dataset by appending this code to the dataset name. This is a standard JavaScript method for filtering data. We plan to make this simpler in the future.

```html title="Filter method"
.filter(d => d.department === $page.params.department)
```
This means that the code will look in the dataset `d` and include only those rows where the department column is equal to the page's parameter variable.

Adding this to a normal `<Value/>` component gives us the following:

```html
<Value 
    data={data.complaints_by_department.filter(d => d.department === $page.params.department)} 
    column=complaints
/>
```

## Follow a Department Link
Click on any of the links to visit the parameterized page for that department, which should look like this:

<div style={{textAlign: 'center'}}>

![param_page_example](/img/department-param-page.png)

</div>

There we have it - a page for each department, but only one underlying file. This could be used to automatically create reports for divisions within companies, analysis of specific products, or anything else. The possibilities are almost endless.

