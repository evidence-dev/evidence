# BigQuery 

Evidence supports connecting to Google BigQuery by using a [service account](https://cloud.google.com/iam/docs/service-accounts) and a JSON key. 

Follow the instructions below to set up your service account and get a JSON key. 

## Create a Service Account Key
1. [Go to the Service Account Page](https://console.cloud.google.com/projectselector/iam-admin/serviceaccounts/create?supportedpurview=project&_ga=2.202527640.867747861.1622513856-469265758.1621868166&_gac=1.81391205.1622124503.CjwKCAjw47eFBhA9EiwAy8kzNKaExCvM0G229wH0PGh4USFcdB7wudKCKWt4MSEPM6wbQKCwOot1NxoCtxIQAvD_BwE) and click on your project
2. Add a name for your service account, then click Create
3. Assign your service account a role for BigQuery (scroll down the role dropdown to find BigQuery roles). **BigQuery User** should work, but it may depend on your organization's permissions settings in Google Cloud. If you run into trouble with permissions, you may need to change this role. Reach out to us if you run into issues or need help with BigQuery permissions.
4. Click Continue, then click Done. You should see a table of users.
5. Click on the email address for the service account you just created, then click the **Keys** tab
6. Click Add Key, then Create New Key, then Create
7. Google will download a JSON Key File to your computer

## Getting help 
If you need some help with this, please feel free to [send us a message in Slack](https://join.slack.com/t/evidencedev/shared_invite/zt-uda6wp6a-hP6Qyz0LUOddwpXW5qG03Q). 
