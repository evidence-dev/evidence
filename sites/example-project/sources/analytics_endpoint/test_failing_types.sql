select 
    date_trunc(created_date, week) as week, 
    count(distinct project_id) as new_projects
from pre_process.project_log
where created_date >= '2021-08-08' and one_time_deploy = false
group by week