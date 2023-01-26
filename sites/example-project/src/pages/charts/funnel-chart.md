
```funnel_data
select 60 as customers, 'Visit' as stage,
union all
select 40 as customers, 'Inquiry' as stage,
union all
select 20 as customers, 'Order' as stage,
union all
select 80 as customers, 'Click' as stage,
union all
select 100 as customers, 'Show' as stage
```




<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Simple Funnel Chart" outlineColor="white"  showPercent=true/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Ascending" outlineColor="white" funnelSort="ascending"  showPercent=true/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Right Aligned" outlineColor="white" funnelAlign="right"  showPercent=true/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Left Aligned" outlineColor="white" funnelAlign="left"  showPercent=true/>

<FunnelChart data={funnel_data} nameCol=stage valueCol=customers title="Funnel Chart" subtitle="Funnel with Percent" showPercent=true/>