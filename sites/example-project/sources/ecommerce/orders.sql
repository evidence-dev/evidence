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