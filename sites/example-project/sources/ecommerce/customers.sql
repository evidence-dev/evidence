select DISTINCT
    CustomerID,
    count(DISTINCT InvoiceNo) as total_orders,
    MIN(invoice_date) as first_order,
    date_trunc('month', first_order) as cohort_month,
    count(InvoiceNo) as total_items,
    sum(UnitPrice*Quantity) as total_spent
from order_items
group by 1