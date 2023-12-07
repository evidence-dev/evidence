# "Twinstibook"

Twinstibook is a fake social media platform with some data populated by the faker datasource.
You can explore the yaml specifications in the `sources/social_media` directory, of you can
[inspect the schema](/explore/schema).

```sql usercount
SELECT COUNT(*) as usercount, 'somestr' as somestr FROM users
```

<BigValue data={usercount} value=usercount title=hello />
<BarChart data={usercount} y=usercount x=somestr title=hello/>
