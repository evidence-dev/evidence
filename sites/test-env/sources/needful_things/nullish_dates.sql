select null::date as country, 100 as sales, true as from_canada
union all 
select null::date as country, 200 as sales, true as from_canada
union all 
select null::date as country, 300 as sales, false as from_canada
order by sales