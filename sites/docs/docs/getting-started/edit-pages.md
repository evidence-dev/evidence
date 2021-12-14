---
sidebar_position: 5
---

# Edit Pages

## Live Preview
Instant feedback is critical to analyst productivity.

The Evidence development server is extraordinarily fast. No matter how large your project is, changes are reflected in the browser almost instantly. 

## Edit a Page
Open `src/pages/firstquery.md` in your editor and [localhost:3000/firstquery](http://localhost:3000/firstquery) in your browser.

Try playing around with the text and see how quickly it updates in the browser every time you save:

<div style={{textAlign: 'center', paddingLeft: '0%'}}>

![edit-headers](/img/edit-markdown-headers.svg)
</div>

<div style={{textAlign: 'center', marginLeft: '5%'}}>

![edit](/img/adding-text-vid.gif)
</div>

For tips on markdown syntax, check out [Markdown Guide.](https://www.markdownguide.org/cheat-sheet/)


## Write your first query
In Evidence you write SQL like this:

````markdown title="src/pages/firstquery.md"
```my_first_query

select 
    101 as my_first_metric,
    200 as my_second_metric

```
````
Every query in Evidence needs a title. The title of the query above is `my_first_query`.

Query titles must be unique within a document, but can be reused across documents.

The SQL statement above is contained in a **fenced code block**, a markdown structure for including code in a document. Evidence will run the SQL you include in these code blocks.

The query above won't be able to run until you connect your data warehouse. You can set up that connection in the next section.