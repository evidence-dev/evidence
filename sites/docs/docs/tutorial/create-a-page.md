---
sidebar_position: 2
title: Create a Page
---

1. **Inside** the `pages` directory, start by editing the homepage for Needful Things, called `index.md`. 

2. Replace the text currently in the file with the text below, to add a header and introduction.

```markdown title="pages/index.md"
![Needful Things Logo](http://static1.squarespace.com/static/55d5e6bbe4b07fd45aec98a4/t/5a67ff45ec212de974357e39/1622153363313/Needful+logo.png?format=180w)

This is Needful Things' Evidence project, where you can find the KPIs and data analysis for the business.

## Reports

[Business Performance](/business-performance) gives an overview of the business KPIs.

[Marketing Performance](/marketing-performance) shows how effective different marketing channels are.

[Product Performance](/product-performance) shows data about specific products.
```
3. Save the page, and enter `npm run dev` in the shell.

4. Delete all the other files inside the `pages` directory (we won't need these).

5. Navigate to [http://localhost:3000/](http://localhost:3000/) in your browser. (The links on the homepage won't work yet as we haven't built them!)

Evidence 'hot reloads' when you save your file by default, so you should get immediate feedback.

You should now be able to see your new page, which looks like this:

<div style={{textAlign: 'center'}}>

![first-additions](/img/tutorial-img/needful-things-first-page-success-v2.png)

</div>

