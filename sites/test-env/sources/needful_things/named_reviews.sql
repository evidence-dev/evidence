SELECT reviews.order_id, reviews.nps_score, orders.first_name as first_name, orders.last_name as last_name
	FROM reviews
	JOIN orders ON reviews.order_id = orders.id;
