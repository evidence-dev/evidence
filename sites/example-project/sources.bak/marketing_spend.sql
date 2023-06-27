select 
* 
from marketing_spend
where date_part('year',  month_begin) = 2019
order by spend desc