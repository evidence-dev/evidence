
```funnel_data
select 97 as customers, 'Show' as stage
union all
select 102 as customers, 'Click' as stage,
union all
select 49 as customers, 'Visit' as stage,
union all
select 40 as customers, 'Inquiry' as stage,
union all
select 14 as customers, 'Order' as stage,
```




<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Simple Funnel Chart" outlineColor="white"/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Descending" outlineColor="white" funnelSort="Descending"/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Ascending" outlineColor="white" funnelSort="ascending"/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Right Aligned" outlineColor="white" funnelAlign="right"/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Left Aligned" outlineColor="white" funnelAlign="left"/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Funnel with Percent" showPercent=true/>