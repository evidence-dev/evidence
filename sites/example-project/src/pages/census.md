<DataTable data={census}/>
<ScatterPlot data={census} y=median_rent_myformat x=income_per_capita_usd size=income_per_capita_usd yAxisTitle="Median Rent" xAxisTitle="Income Per Capita"/>

<DataTable data={grades} />
<BarChart data={grades} series=name title="Grades"/>

```census
select 'Product A' as product, 371 as median_rent_myformat, 12279 as income_per_capita_usd,  union all
select 'Product B' as product, 1434 as median_rent_myformat, 33882 as income_per_capita_usd,  union all
select 'Product C' as product, 698 as median_rent_myformat, 26386 as income_per_capita_usd,  union all
select 'Product D' as product, 1085 as median_rent_myformat, 34222 as income_per_capita_usd,  union all
select 'Product E' as product, 523 as median_rent_myformat, 24478 as income_per_capita_usd,  union all
select 'Product F' as product, 844 as median_rent_myformat, 32443 as income_per_capita_usd,  union all
select 'Product G' as product, 703 as median_rent_myformat, 30883 as income_per_capita_usd,  union all
select 'Product H' as product, 720 as median_rent_myformat, 31088 as income_per_capita_usd,  union all
select 'Product I' as product, 548 as median_rent_myformat, 25316 as income_per_capita_usd,  union all
select 'Product J' as product, 693 as median_rent_myformat, 34041 as income_per_capita_usd,  union all
select 'Product K' as product, 574 as median_rent_myformat, 23121 as income_per_capita_usd,  union all
select 'Product L' as product, 667 as median_rent_myformat, 29428 as income_per_capita_usd,  union all
select 'Product M' as product, 621 as median_rent_myformat, 29611 as income_per_capita_usd,  union all
select 'Product N' as product, 697 as median_rent_myformat, 25311 as income_per_capita_usd,  union all
select 'Product O' as product, 633 as median_rent_myformat, 28323 as income_per_capita_usd,  union all
select 'Product P' as product, 571 as median_rent_myformat, 26779 as income_per_capita_usd,  union all
select 'Product Q' as product, 1408 as median_rent_myformat, 52500 as income_per_capita_usd,  union all
select 'Product R' as product, 843 as median_rent_myformat, 29525 as income_per_capita_usd,  union all
select 'Product S' as product, 666 as median_rent_myformat, 28764 as income_per_capita_usd,  union all
select 'Product T' as product, 858 as median_rent_myformat, 29420 as income_per_capita_usd,  union all
select 'Product U' as product, 1116 as median_rent_myformat, 37156 as income_per_capita_usd,  union all
select 'Product V' as product, 852 as median_rent_myformat, 34196 as income_per_capita_usd,  union all
select 'Product W' as product, 628 as median_rent_myformat, 30865 as income_per_capita_usd,  union all
select 'Product X' as product, 1151 as median_rent_myformat, 40567 as income_per_capita_usd,  union all
select 'Product Y' as product, 865 as median_rent_myformat, 28085 as income_per_capita_usd,  union all
select 'Product Z' as product, 903 as median_rent_myformat, 30166 as income_per_capita_usd,  union all
select 'Product AA' as product, 699 as median_rent_myformat, 31998 as income_per_capita_usd,  union all
select 'Product AB' as product, 628 as median_rent_myformat, 29438 as income_per_capita_usd,  union all
select 'Product AC' as product, 1125 as median_rent_myformat, 36345 as income_per_capita_usd,  union all
select 'Product AD' as product, 678 as median_rent_myformat, 25885 as income_per_capita_usd,  union all
select 'Product AE' as product, 975 as median_rent_myformat, 29838 as income_per_capita_usd,  union all
select 'Product AF' as product, 620 as median_rent_myformat, 26472 as income_per_capita_usd,  union all
select 'Product AG' as product, 627 as median_rent_myformat, 30038 as income_per_capita_usd,  union all
select 'Product AH' as product, 636 as median_rent_myformat, 30146 as income_per_capita_usd,  union all
select 'Product AI' as product, 1193 as median_rent_myformat, 39960 as income_per_capita_usd,  union all
select 'Product AJ' as product, 935 as median_rent_myformat, 33887 as income_per_capita_usd,  union all
select 'Product AK' as product, 935 as median_rent_myformat, 31950 as income_per_capita_usd,  union all
select 'Product AL' as product, 953 as median_rent_myformat, 38237 as income_per_capita_usd,  union all
select 'Product AM' as product, 565 as median_rent_myformat, 26498 as income_per_capita_usd,  union all
select 'Product AN' as product, 698 as median_rent_myformat, 29560 as income_per_capita_usd,  union all
select 'Product AO' as product, 963 as median_rent_myformat, 42029 as income_per_capita_usd,  union all
select 'Product AP' as product, 1084 as median_rent_myformat, 41821 as income_per_capita_usd,  union all
select 'Product AQ' as product, 657 as median_rent_myformat, 30915 as income_per_capita_usd,  union all
select 'Product AR' as product, 832 as median_rent_myformat, 34511 as income_per_capita_usd,  union all
select 'Product AS' as product, 665 as median_rent_myformat, 27909 as income_per_capita_usd,  union all
select 'Product AT' as product, 693 as median_rent_myformat, 30488 as income_per_capita_usd,  union all
select 'Product AU' as product, 782 as median_rent_myformat, 29668 as income_per_capita_usd,  union all
select 'Product AV' as product, 1087 as median_rent_myformat, 36975 as income_per_capita_usd,  union all
select 'Product AW' as product, 1005 as median_rent_myformat, 37442 as income_per_capita_usd,  union all
select 'Product AX' as product, 859 as median_rent_myformat, 36156 as income_per_capita_usd,  union all
select 'Product AY' as product, 743 as median_rent_myformat, 32711 as income_per_capita_usd,  union all
select 'Product AZ' as product, 1320 as median_rent_myformat, 35046 as income_per_capita_usd,
```


```grades
select 'Product A' as name, 0.771 as grade_pct union all
select 'Product B' as name, 0.072 as grade_pct union all
select 'Product C' as name, 0.91 as grade_pct union all
select 'Product D' as name, 0.21 as grade_pct union all
select 'Product E' as name, 0.31 as grade_pct union all
select 'Product F' as name, 0.56 as grade_pct
```