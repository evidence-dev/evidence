# DuckDB Types

This page shows all the types that are supported by DuckDB, and how they are formatted by default.

```sql test_data
SELECT
    'example varchar' AS varchar,
    true AS bool,
    127 AS tinyint,
    32767 AS smallint,
    2147483647 AS int,
    9223372036854775807 AS bigint,
    12345678901234567890 AS hugeint,
    255 AS utinyint,
    65535 AS usmallint,
    4294967295 AS uint,
    18446744073709551615 AS ubigint,
    current_date()::DATE AS date,
    '12:34:56'::TIME AS time,
    '2023-01-01 12:34:56'::TIMESTAMP AS timestamp,
    '2023-01-01 12:34:56'::TIMESTAMP_S AS timestamp_s,
    '2023-01-01 12:34:56'::TIMESTAMP_MS AS timestamp_ms,
    '2023-01-01 12:34:56'::TIMESTAMP_NS AS timestamp_ns,
    '12:34:56+00:00'::TIME WITH TIME ZONE AS time_tz,
    '2023-01-01 12:34:56+00:00'::TIMESTAMP WITH TIME ZONE AS timestamp_tz,
    3.14 AS float,
    3.14159265359 AS double,
    3.14159265359::DECIMAL(4,1) AS dec_4_1,
    3.14159265359::DECIMAL(9,4) AS dec_9_4,
    3.14159265359::DECIMAL(18,6) AS dec_18_6,
    3.14159265359::DECIMAL(38,10) AS dec38_10,
    B'101010' AS bit, 
    X'53514C' AS blob,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID AS uuid
```

# Test Values

| Type | Example |
| :- | :- |
| varchar | <Value data={test_data} column="varchar" /> |
| bool | <Value data={test_data} column="bool" /> |
| tinyint | <Value data={test_data} column="tinyint" /> |
| smallint | <Value data={test_data} column="smallint" /> |
| int | <Value data={test_data} column="int" /> |
| bigint | <Value data={test_data} column="bigint" /> |
| hugeint | <Value data={test_data} column="hugeint" /> |
| utinyint | <Value data={test_data} column="utinyint" /> |
| usmallint | <Value data={test_data} column="usmallint" /> |
| uint | <Value data={test_data} column="uint" /> |
| ubigint | <Value data={test_data} column="ubigint" /> |
| date | <Value data={test_data} column="date" /> |
| time | <Value data={test_data} column="time" /> |
| timestamp | <Value data={test_data} column="timestamp" /> |
| timestamp_s | <Value data={test_data} column="timestamp_s" /> |
| timestamp_ms | <Value data={test_data} column="timestamp_ms" /> |
| timestamp_ns | <Value data={test_data} column="timestamp_ns" /> |
| time_tz | <Value data={test_data} column="time_tz" /> |
| timestamp_tz | <Value data={test_data} column="timestamp_tz" /> |
| float | <Value data={test_data} column="float" /> |
| double | <Value data={test_data} column="double" /> |
| decimal(4,1) | <Value data={test_data} column="dec_4_1" /> |
| decimal(9,4) | <Value data={test_data} column="dec_9_4" /> |
| decimal(18,6) | <Value data={test_data} column="dec_18_6" /> |
| decimal(38,10) | <Value data={test_data} column="dec38_10" /> |
| bit | <Value data={test_data} column="bit" /> |
| blob | <Value data={test_data} column="blob" /> |
| uuid | <Value data={test_data} column="uuid" /> |




# Nastier Test Values

```sql all_types
select 
    *
from test_all_types()
limit 2
```

<DataTable data={all_types}/>

## Strings

### varchar

My varchar is **<Value data={all_types} column="varchar" row=1/>**

### blob

My blob is **<Value data={all_types} column="blob" row=1/>**


## Booleans

### bool

My bool is **<Value data={all_types} column="bool" row=1/>**


## Integers

### tinyint

<BarChart 
    data={all_types}
    x="varchar"
    y="tinyint"
/>

My tinyint is **<Value data={all_types} column="tinyint" />**

### smallint

<BarChart 
    data={all_types}
    x="varchar"
    y="smallint"
/>

My smallint is **<Value data={all_types} column="smallint" />**

### int

<BarChart 
    data={all_types}
    x="varchar"
    y="int"
/>

My int is **<Value data={all_types} column="int" />**

### bigint

<BarChart 
    data={all_types}
    x="varchar"
    y="bigint"
/>

My bigint is **<Value data={all_types} column="bigint" />**

### hugeint

<BarChart 
    data={all_types}
    x="varchar"
    y="hugeint"
/>

My hugeint is **<Value data={all_types} column="hugeint" />**

### utinyint

<BarChart 
    data={all_types}
    x="varchar"
    y="utinyint"
/>

My utinyint is **<Value data={all_types} column="utinyint" row=1/>   **

### usmallint

<BarChart 
    data={all_types}
    x="varchar"
    y="usmallint"
/>

My usmallint is **<Value data={all_types} column="usmallint" row=1/>   **

### uint

<BarChart 
    data={all_types}
    x="varchar"
    y="uint"
/>

My uint is **<Value data={all_types} column="uint" row=1/>   **

### ubigint

<BarChart 
    data={all_types}
    x="varchar"
    y="ubigint"
/>

My ubigint is **<Value data={all_types} column="ubigint" row=1/>   **

## Floats

### float

<BarChart 
    data={all_types}
    x="varchar"
    y="float"
/>

My float is **<Value data={all_types} column="float" row=1/>**

### double

<BarChart 
    data={all_types}
    x="varchar"
    y="double"
/>

My double is **<Value data={all_types} column="double" row=1/>**



## Dates

### date

<BarChart
    data={all_types}
    x=date
    y=smallint
/>

My date is **<Value data={all_types} column="date" row=1/>**

### timestamp

<BarChart
    data={all_types}
    x=timestamp
    y=smallint
/>

My timestamp is **<Value data={all_types} column="timestamp" row=0/>**

### timestamp_s

<BarChart
    data={all_types}
    x=timestamp_s
    y=smallint
/>

My timestamp_s is **<Value data={all_types} column="timestamp_s" row=0/>**

### timestamp_ms

<BarChart
    data={all_types}
    x=timestamp_ms
    y=smallint
/>

My timestamp_ms is **<Value data={all_types} column="timestamp_ms" row=0/>**

### timestamp_ns

<BarChart
    data={all_types}
    x=timestamp_ns
    y=smallint
/>

My timestamp_ns is **<Value data={all_types} column="timestamp_ns" row=0/>**

### timestamp_tz

<BarChart
    data={all_types}
    x=timestamp_tz
    y=smallint
/>

My timestamp_tz is **<Value data={all_types} column="timestamp_tz" row=0/>**

## Times

### time

<BarChart
    data={all_types}
    x=time
    y=smallint
/>

My time is **<Value data={all_types} column="time" row=0/>**

### time_tz

<BarChart
    data={all_types}
    x=time_tz
    y=smallint
/>

My time_tz is **<Value data={all_types} column="time_tz" row=0/>**


## Decimals

### decimal(4,1)

<BarChart
    data={all_types}
    x=varchar
    y=dec_4_1
/>

My dec(4,1) is **<Value data={all_types} column="dec_4_1" row=0/>**

### decimal(9,4)

<BarChart
    data={all_types}
    x=varchar
    y=dec_9_4
/>

My dec(9,4) is **<Value data={all_types} column="dec_9_4" row=0/>**

### decimal(18,6)

<BarChart
    data={all_types}
    x=varchar
    y=dec_18_6
/>

My dec(18,6) is **<Value data={all_types} column="dec_18_6" row=0/>**

### decimal(38,10)

<BarChart
    data={all_types}
    x=varchar
    y=dec38_10
/>

My decimal(38,10) is **<Value data={all_types} column="dec38_10" row=0/>**

