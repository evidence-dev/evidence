<script>
    let wf = [
        {"category": "PY Revenue", "revenue_usd": 100000, "total": true},
        {"category": "New Customers", "revenue_usd": 20000, "total": false},
        {"category": "Upsell", "revenue_usd": 10000, "total": false},
        // {"category": "Subtotal", "revenue_usd": 130000, "total": true},
        {"category": "Churn", "revenue_usd": -1000, "total": false},
        {"category": "Price Changes", "revenue_usd": -5000, "total": false},
        {"category": "CY Revenue", "revenue_usd": 124000, "total": true}
    ]

    let bal = [
        {"category": "balance", "amount_usd": -1000, "total": true},
        {"category": "deposits", "amount_usd": 500, "total": false},
        {"category": "withdrawals", "amount_usd": -300, "total": false},
        {"category": "new balance", "amount_usd": -800, "total": true}
    ]

    let diff = [
    {'category': 'start', 'value': -10000, 'total': false},
    {'category': 'one', 'value': 30000, 'total': false},
    {'category': 'two', 'value': 20000, 'total': false},
    {'category': 'subtotal', 'value': 40000, 'total': true},
{'category': 'three', 'value': -80000, 'total': false},
    {'category': 'four', 'value': 50000, 'total': false},
    {'category': 'five', 'value': 10000, 'total': false}
]
</script>

# Waterfall Chart

```waterfall
select 'PY Revenue' as category, 1200000 as revenue_usd, true as total
union all 
select 'New Customers' as category, 135423 as revenue_usd, false as total
union all 
select 'Upsell' as category, 25310 as revenue_usd, false as total
union all 
select 'Churn' as category, -45368 as revenue_usd, false as total
union all 
select 'Price Changes' as category, -551250 as revenue_usd, false as total
union all 
select 'CY Revenue' as category, 740115 as revenue_usd, true as total
```

<WaterfallChart 
    data={wf} 
    x=category
    y=revenue_usd 
    total=total 
    yMin=80000
/>

<WaterfallChart
    data={bal}
    x=category
    y=amount_usd
    total=total
/>

<WaterfallChart
    data={diff}
    x=category
    y=value
    total=total
/>

<WaterfallChart 
    data={waterfall} 
    category=category 
    value=revenue_usd 
    total=total 
    swapXY=true
/>

<WaterfallChart
    data={diff}
    x=category
    y=value
    total=total
    swapXY=true
/>
