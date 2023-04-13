# Data Table

```fda_recalls
SELECT date_trunc(recall_initiation_date, year) as year,
sum(if(voluntary_mandated = "Voluntary: Firm Initiated", 1, 0)) as voluntary_recalls,
sum(if(voluntary_mandated = "FDA Mandated", 1, 0)) as fda_recalls
FROM `bigquery-public-data.fda_food.food_enforcement`
where recall_initiation_date > '2000-01-01'
group by year
```

```census
select median_rent as median_rent_usd, income_per_capita as income_per_capita_usd
from `bigquery-public-data.census_bureau_acs.state_2017_1yr`
```

Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet enim rutrum, rutrum metus in, vulputate quam. Duis posuere enim feugiat urna fringilla blandit vehicula ac dui. Nunc consequat enim vel purus vestibulum rhoncus. Nunc porta luctus odio, ac luctus urna tincidunt cursus.
<DataTable data={fda_recalls}/>

Nulla facilisi. Aliquam vulputate mollis aliquam. Duis dignissim elementum dictum. Curabitur ornare lorem velit, eget tempus ex suscipit eu. Sed nec nisl a lorem vulputate interdum. Pellentesque viverra vitae est sed porttitor. Etiam interdum in enim a pellentesque.

<DataTable data={census} rowNumbers=true search=true rowLines=true/>

Aliquam massa elit, egestas eget risus nec, rhoncus vehicula ante. Cras placerat vitae ante eu hendrerit. Ut eget nunc nec ligula rutrum euismod. Vivamus at viverra elit. Nam id velit leo. Cras nisl velit, lacinia eget elementum vitae, tristique id purus. Vestibulum imperdiet congue mollis. Ut neque sapien, malesuada ut ultrices at, hendrerit at lorem. Aenean ornare suscipit pellentesque. Etiam facilisis nibh in diam suscipit, ut tincidunt est ultrices.

## Rows Property

### rows=40

<DataTable data={census} rows=40 rowNumbers=true/>
