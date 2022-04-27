---
sidebar_position: 2
---
# Create a Page

## Getting the template directory ready
1. To begin with, let's delete files we don't need from the template directory:

   - LICENSE
   - examples.md
   - All the files inside the 'pages' folder

2. We also need the add the data from the Needful Things - we are going to use a local SQLite database for the tutorial. 

   [Download the SQLite database here](/needful_things.db) and put it in your my-project folder, *renaming the file* to `needful_things.db`.

   Your folder should now look something like this:

```
my-project
|-- .evidence /
|-- node_modules /
|-- pages /
|-- .gitignore
|-- README.md
|-- needful_things.db
|-- package-lock.json
`-- package.json
```

3. Enter `npm run dev` into the shell, and connect to the SQLite database using the [settings](http://localhost:3000/settings) menu in the bottom left corner of your browser.


:::note
You will get a 404 error at [http://localhost:3000/](http://localhost:3000/) for now - that's because we haven't added any pages yet!
:::

## Create a markdown page


**Inside** the `pages` directory, start by creating a homepage for Needful Things, called `index.md`. Copy and paste the text below into your file to add a header and introduction to your homepage.

```markdown title="pages/index.md"
# Needful Things Inc.

Needful Things is a fictional ecommerce store that sells zany artifacts online.

In this tutorial we're going to help them work out what's happening in their business.

```

Save the page, navigate to [http://localhost:3000/](http://localhost:3000/) in your browser and refresh if neccesary.

Evidence 'hot reloads' when you save your file by default, so you should get immediate feedback.

You should now be able to see your new page, which looks like this:

<div style={{textAlign: 'center'}}>

![first-additions](/img/tutorial-img/needful-things-first-page-success.png)

</div>