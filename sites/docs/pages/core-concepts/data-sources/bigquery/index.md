---
title: BigQuery
description: Connect Evidence to Google BigQuery
sidebar_link: false
---

BigQuery is a Google Cloud's data warehouse that allows you to store and query large datasets using SQL. Evidence supports connecting to BigQuery as a data source.

<NewSource sourceName="BigQuery" />

## Configuration

Evidence supports multiple options for connecting to Google BigQuery:
- [gcloud CLI](#gcloud-cli)
- [Service Account with JSON Keyfile](#service-account)
- [OAuth Access Token](#oauth-access-token)

### gcloud CLI

If you have the [gcloud CLI](https://cloud.google.com/sdk/gcloud) installed, you can log in to BigQuery using the following command:

```bash
gcloud auth application-default login
```

Evidence will use the credentials stored by the gcloud CLI to connect to BigQuery.

> *Note: Since gcloud requires browser access, this method is only available when developing locally.*

### Service Account

1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role for BigQuery (scroll down the role dropdown to find BigQuery roles).
   1. **BigQuery User** should work for most use cases.
   1. **BigQuery Data Viewer** may be required (depending on your organization's permissions settings in Google Cloud).
   1. Reach out to us if you run into issues or need help with BigQuery permissions.
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer

### OAuth Access Token

If you have an access token but can't download the gcloud CLI on the device you're deploying on and don't want to use a service account, you can use an OAuth access token.

An OAuth access token can be generated by running the following command on a device with the gcloud CLI installed:

```bash
gcloud auth application-default print-access-token
```
> *Note: This token will expire after 1 hour.*

Now you can copy the access token and use it in your Evidence app.

