---
sidebar_position: 1
hide_table_of_contents: false
title: Deployment Overview
---


In production, Evidence functions like a [static site generator](https://www.netlify.com/blog/2020/04/14/what-is-a-static-site-generator-and-3-ways-to-find-the-best-one/). As a result, you can host your Evidence project using a variety of cloud services, or your own infrastructure.

For now, the easiest way to host your Evidence project is to use Netlify. We have [detailed instructions on hosting on Netlify here](netlify). You can use Netlify to host a public version of your project for free, or you can host a password-protected version of your project using Netlify's $15/month plan. You can also provide Netlify with a custom domain where it will deploy your app (or you can buy a domain through Netlify).

## Evidence Cloud 

If you are interested in using Evidence, but you would prefer not to self-host your project, you might be interested in our forthcoming cloud service.

To be notified when Evidence Cloud is available, [sign up for the waitlist](https://du3tapwtcbi.typeform.com/to/kwp7ZD3q). 


## Build Process  

Evidence doesn't run new queries each time someone visits one of your reports. 

Instead, Evidence runs your queries once, at build time, and statically generates *all* of the pages in your project. This includes all possible permutations of any paramaterized pages. 

You can schedule (or trigger) regular builds of your site to keep it up-to-date with your data warehouse. 

This has two benefits for you and your users: 

1. If something goes wrong with your SQL, Evidence just stops building your project, and continues to serve older results. 
2. Your site will be exceptionally fast. Under most conditions, pages will load in milliseconds. 

## Builds 

The command `npm run build` will build a static version of your reports and place them in the `build` directory. 

## Environment Variables 

In production, Evidence expects to find your database credentials in **environment variables**. 

By default, the `database.config.json` file containing your credentials will not be checked into version control, and it will not be available in your production environment. 

Below are the required environment variables for the databases we support. These screenshots are from a Netlify deployment, but the variables should be the same wherever you decide to deploy your project.

### PostgreSQL
![env_vars_pg_done](/img/env_vars_pg_done.png)

### Snowflake
![env_vars_sf_done](/img/env_vars_sf_done.png)

### BigQuery
You will need the 3 variables below from the JSON key file you generated for your BigQuery service account:

![env_vars_bq_done](/img/env_vars_bq_done.png)

