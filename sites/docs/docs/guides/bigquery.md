---
title: BigQuery
sidebar_position: 5
---


## BigQuery

Evidence supports connecting to Google BigQuery by using a [service account](https://cloud.google.com/iam/docs/service-accounts) and a JSON key. 

Follow the instructions below to set up your service account and get a JSON key. 

### Create a Service Account Key

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
