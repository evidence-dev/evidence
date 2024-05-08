```sql hashtags
SELECT tag as label, id as value from hashtags
```

```sql post_count_by_tag
SELECT * FROM post_tags
```

<Dropdown title="Single Select w/ noDefault" data={hashtags} name="single_no_default" value=value label=label noDefault />


<Dropdown title="Single Select w/o Default" data={hashtags} name="single_without_default" value=value label=label />


<Dropdown title="Single Select w/ Default" data={hashtags} name="single_with_default" value=value label=label defaultValue={[4]} />


<Dropdown multiple title="Multi Select w/ noDefault" data={hashtags} name="multi_no_default" value=value label=label noDefault />


<Dropdown multiple title="Multi Select w/o Default" data={hashtags} name="multi_without_default" value=value label=label />


<Dropdown multiple title="Multi Select w/ Default" data={hashtags} name="multi_with_default" value=value label=label defaultValue={[4]} />


<Tabs>
  <Tab label="Single Select with noDefault set">

```sql q_single_no_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id = ${inputs.single_no_default.value}
```
      ## {inputs.single_no_default.label}
      ### Using derived query
      
      <DataTable compact title="single_no_default" data={q_single_no_default} />

      ### Using .where
      
      <DataTable compact title="single_no_default" data={post_count_by_tag.where(`hashtag_id = ${inputs.single_no_default.value}`)} />
  </Tab>
  <Tab label="Single Select without a Default">

```sql q_single_without_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id = ${inputs.single_without_default.value}
```
      ## {inputs.single_without_default.label}
      ### Using derived query
      
      <DataTable compact title="single_without_default" data={q_single_without_default} />

      ### Using .where
      
      <DataTable compact title="single_without_default" data={post_count_by_tag.where(`hashtag_id = ${inputs.single_without_default.value}`)} />
  </Tab>
  <Tab label="Single Select with a Default">

```sql q_single_with_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id = ${inputs.single_with_default.value}
```

      ## {inputs.single_with_default.label}
      ### Using derived query
      
      <DataTable compact title="single_with_default" data={q_single_with_default} />

      ### Using .where
      
      <DataTable compact title="single_with_default" data={post_count_by_tag.where(`hashtag_id = ${inputs.single_with_default.value}`)} />
  </Tab>


  
  <Tab label="Multi Select with noDefault set">

```sql q_multi_no_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id in ${inputs.multi_no_default.value}
```
      ## {inputs.multi_no_default.label}
      ### Using derived query

      <DataTable compact title="multi_no_default" data={q_multi_no_default} />

      ### Using .where
      
      <DataTable compact title="multi_no_default" data={post_count_by_tag.where(`hashtag_id in ${inputs.multi_no_default.value}`)} />
  </Tab>
  <Tab label="Multi Select without a Default">

```sql q_multi_without_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id in ${inputs.multi_without_default.value}
```
      ## {inputs.multi_without_default.label}
      ### Using derived query
      
      <DataTable compact title="multi_without_default" data={q_multi_without_default} />

      ### Using .where
      
      <DataTable compact title="multi_without_default" data={post_count_by_tag.where(`hashtag_id in ${inputs.multi_without_default.value}`)} />
  </Tab>
  <Tab label="Multi Select with a Default">

```sql q_multi_with_default
SELECT * FROM ${post_count_by_tag} WHERE hashtag_id in ${inputs.multi_with_default.value}
```

      ## {inputs.multi_with_default.label}
      ### Using derived query
      
      <DataTable compact title="multi_with_default" data={q_multi_with_default} />

      ### Using .where
      
      <DataTable compact title="multi_with_default" data={post_count_by_tag.where(`hashtag_id in ${inputs.multi_with_default.value}`)} />
  </Tab>
</Tabs>


