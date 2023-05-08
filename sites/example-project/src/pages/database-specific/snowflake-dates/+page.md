# Snowflake Date & Time Fields

<!-- {new Date('2020-03-03T00:00:00')} -->

## Timestamp Types

```sql timestamps
select
    to_date('2020-04-22') as date,
    to_timestamp('2020-04-22') as timestamp,
    to_timestamp_tz('2020-04-22') as timestamp_tz,
    to_timestamp_ntz('2020-04-22') as timestamp_ntz,
    to_timestamp_ltz('2020-04-22') as timestamp_ltz
```

<Value data={timestamps} column=date/>
<Value data={timestamps} column=timestamp/>
<Value data={timestamps} column=timestamp_tz/>
<Value data={timestamps} column=timestamp_ntz/>
<Value data={timestamps} column=timestamp_ltz/>

## Date

```sql snowflake_date
select
        to_date('2020-04-22') as date,
        100 as sales_usd
union all
select
        to_date('2020-04-23') as date,
        110 as sales_usd
union all
select
        to_date('2020-04-24') as date,
        120 as sales_usd
union all
select
        to_date('2020-04-25') as date,
        140 as sales_usd
```

<DataTable data={snowflake_date}/>

<LineChart
    data={snowflake_date}
    x=date
    y=sales_usd
/>

## Timestamp

```sql snowflake_timestamp
select
        to_timestamp('2020-04-22') as timestamp,
        100 as sales_usd
union all
select
        to_timestamp('2020-04-23') as timestamp,
        110 as sales_usd
union all
select
        to_timestamp('2020-04-24') as timestamp,
        120 as sales_usd
union all
select
        to_timestamp('2020-04-25') as timestamp,
        140 as sales_usd
```

<DataTable data={snowflake_timestamp}/>

<LineChart
    data={snowflake_timestamp}
    x=timestamp
    y=sales_usd
/>

## Timestamp_tz

```sql snowflake_timestamp_tz
select
        to_timestamp_tz('2020-04-22') as timestamp_tz,
        100 as sales_usd
union all
select
        to_timestamp_tz('2020-04-23') as timestamp_tz,
        110 as sales_usd
union all
select
        to_timestamp_tz('2020-04-24') as timestamp_tz,
        120 as sales_usd
union all
select
        to_timestamp_tz('2020-04-25') as timestamp_tz,
        140 as sales_usd
```

<DataTable data={snowflake_timestamp_tz}/>

<LineChart
    data={snowflake_timestamp_tz}
    x=timestamp_tz
    y=sales_usd
/>

## Timestamp_ntz

```sql snowflake_timestamp_ntz
select
        to_timestamp_ntz('2020-04-22') as timestamp_ntz,
        100 as sales_usd
union all
select
        to_timestamp_ntz('2020-04-23') as timestamp_ntz,
        110 as sales_usd
union all
select
        to_timestamp_ntz('2020-04-24') as timestamp_ntz,
        120 as sales_usd
union all
select
        to_timestamp_ntz('2020-04-25') as timestamp_ntz,
        140 as sales_usd
```

<DataTable data={snowflake_timestamp_ntz}/>

<LineChart
    data={snowflake_timestamp_ntz}
    x=timestamp_ntz
    y=sales_usd
/>

## Timestamp_ltz

```sql snowflake_timestamp_ltz
select
        to_timestamp_ltz('2020-04-22') as timestamp_ltz,
        100 as sales_usd
union all
select
        to_timestamp_ltz('2020-04-23') as timestamp_ltz,
        110 as sales_usd
union all
select
        to_timestamp_ltz('2020-04-24') as timestamp_ltz,
        120 as sales_usd
union all
select
        to_timestamp_ltz('2020-04-25') as timestamp_ltz,
        140 as sales_usd
```

<DataTable data={snowflake_timestamp_ltz}/>

<LineChart
    data={snowflake_timestamp_ltz}
    x=timestamp_ltz
    y=sales_usd
/>
