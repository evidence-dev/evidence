with orders as (
SELECT 
    DISTINCT(InvoiceNo), 
    customerID,
    invoice_date,
    count(InvoiceNo) as total_items,
    sum(UnitPrice*Quantity) as total_sales,
    ROW_NUMBER() OVER (PARTITION BY customerID ORDER BY InvoiceNo) as order_number,
    case 
        WHEN customerID IS NULL THEN 'Unknown'
        WHEN order_number = 1 THEN 'New'
        ELSE 'Repeat'
    END as repeat_status
from order_items
group by 1,2,3
order by 1
)

select
    date_trunc('month',invoice_date) as order_month,
    sum(total_sales) as total_sales,
    count(*) as number_of_orders
from orders
group by 1
order by 1