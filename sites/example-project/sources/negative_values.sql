select 100 as daily_change, strptime('2023-01-01', '%Y-%m-%d') as date 
union all
select 200 as daily_change, strptime('2023-01-02', '%Y-%m-%d') as date
union all
select 300 as daily_change, strptime('2023-01-03', '%Y-%m-%d') as date
union all
select 400 as daily_change, strptime('2023-01-04', '%Y-%m-%d') as date
union all
select -100 as daily_change, strptime('2023-01-05', '%Y-%m-%d') as date
union all
select 500 as daily_change, strptime('2023-01-06', '%Y-%m-%d') as date