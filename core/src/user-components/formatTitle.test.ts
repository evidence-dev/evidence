import { describe, it, expect } from 'vitest';
import formatTitle from './formatTitle';

describe('formatTitle', () => {
	describe('basic transformations', () => {
		it('should convert snake_case to Title Case', () => {
			expect(formatTitle('daily_active_users')).toBe('Daily Active Users');
			expect(formatTitle('total_sales')).toBe('Total Sales');
			expect(formatTitle('order_count')).toBe('Order Count');
		});

		it('should handle single words', () => {
			expect(formatTitle('revenue')).toBe('Revenue');
			expect(formatTitle('category')).toBe('Category');
		});

		it('should collapse multiple underscores', () => {
			expect(formatTitle('total__sales')).toBe('Total Sales');
			expect(formatTitle('order___count')).toBe('Order Count');
		});
	});

	describe('acronyms', () => {
		it('should preserve common acronyms in uppercase', () => {
			expect(formatTitle('total_arr')).toBe('Total ARR');
			expect(formatTitle('monthly_mrr')).toBe('Monthly MRR');
			expect(formatTitle('customer_ltv')).toBe('Customer LTV');
			expect(formatTitle('user_id')).toBe('User ID');
		});

		it('should preserve time-based acronyms', () => {
			expect(formatTitle('sales_ytd')).toBe('Sales YTD');
			expect(formatTitle('revenue_mtd')).toBe('Revenue MTD');
			expect(formatTitle('growth_yoy')).toBe('Growth YOY');
			expect(formatTitle('change_mom')).toBe('Change MOM');
		});
	});

	describe('lowercase words', () => {
		it('should keep joining words lowercase', () => {
			expect(formatTitle('day_of_week')).toBe('Day of Week');
			expect(formatTitle('state_of_the_union')).toBe('State of the Union');
		});
	});

	describe('parentheses transformation (default behavior)', () => {
		it('should convert parentheses to "of" when not user-provided', () => {
			expect(formatTitle('sum(revenue)')).toBe('Sum of Revenue');
			expect(formatTitle('count(orders)')).toBe('Count of Orders');
		});

		it('should handle nested function-like patterns', () => {
			expect(formatTitle('avg(daily_sales)')).toBe('Avg of Daily Sales');
		});
	});

	describe('isUserProvidedAlias parameter', () => {
		it('should preserve user-provided aliases exactly as-is', () => {
			expect(formatTitle('Utilisateur(-trice)s actifs', undefined, 1, undefined, true)).toBe(
				'Utilisateur(-trice)s actifs'
			);
			expect(formatTitle('Revenue (USD)', undefined, 1, undefined, true)).toBe('Revenue (USD)');
			expect(formatTitle('Active User(s)', undefined, 1, undefined, true)).toBe('Active User(s)');
		});

		it('should preserve special characters in user-provided aliases', () => {
			expect(formatTitle('Taux de conversion (%)', undefined, 1, undefined, true)).toBe(
				'Taux de conversion (%)'
			);
			expect(formatTitle('Price ($)', undefined, 1, undefined, true)).toBe('Price ($)');
		});

		it('should strip surrounding quotes from user-provided aliases', () => {
			expect(formatTitle('"My Label"', undefined, 1, undefined, true)).toBe('My Label');
			expect(formatTitle("'My Label'", undefined, 1, undefined, true)).toBe('My Label');
			expect(formatTitle('`My Label`', undefined, 1, undefined, true)).toBe('My Label');
		});

		it('should preserve internal quotes in user-provided aliases', () => {
			expect(formatTitle('Say "Hello"', undefined, 1, undefined, true)).toBe('Say "Hello"');
			expect(formatTitle("aujourd'hui", undefined, 1, undefined, true)).toBe("aujourd'hui");
		});

		it('should trim whitespace from user-provided aliases', () => {
			expect(formatTitle('  My Label  ', undefined, 1, undefined, true)).toBe('My Label');
		});

		it('should NOT transform parentheses when isUserProvidedAlias is true', () => {
			// Without flag: parentheses become "of"
			expect(formatTitle('sum(total)')).toBe('Sum of Total');
			// With flag: parentheses preserved
			expect(formatTitle('sum(total)', undefined, 1, undefined, true)).toBe('sum(total)');
		});

		it('should preserve user alias with parentheses from SQL expression', () => {
			// This simulates: sum(sales) as "total sales (by month)"
			// After extractColumnAlias, we get "total sales (by month)" and isUserProvidedAlias=true
			expect(formatTitle('total sales (by month)', undefined, 1, undefined, true)).toBe(
				'total sales (by month)'
			);
		});
	});

	describe('edge cases', () => {
		it('should return empty string for undefined or null', () => {
			expect(formatTitle(undefined)).toBe('');
			expect(formatTitle(null as unknown as string)).toBe('');
		});

		it('should handle empty string', () => {
			expect(formatTitle('')).toBe('');
		});

		it('should handle strings with only whitespace', () => {
			expect(formatTitle('   ')).toBe('');
		});

		it('should remove double quotes', () => {
			expect(formatTitle('"total_sales"')).toBe('Total Sales');
		});
	});

	describe('internal column prefixes', () => {
		it('should strip __ev_ prefix', () => {
			expect(formatTitle('__ev_total_sales')).toBe('Total Sales');
		});

		// Snowflake folds unquoted identifiers to uppercase, so the same column
		// comes back as __EV_*. Detection must be case-insensitive.
		it('should strip __EV_ prefix (Snowflake casing)', () => {
			expect(formatTitle('__EV_TOTAL_SALES')).toBe('Total Sales');
		});

		it('should format comparison columns from Snowflake (uppercase)', () => {
			expect(formatTitle('__EV_SUM_TOTAL_SALES_PRIOR_YEAR_COMPARISON_PCT')).toBe(
				'Sum Total Sales % YoY'
			);
			expect(formatTitle('__EV_SUM_TOTAL_SALES_PRIOR_YEAR_COMPARISON_ABS')).toBe(
				'Sum Total Sales Δ YoY'
			);
			expect(formatTitle('__EV_SUM_TOTAL_SALES_PRIOR_PERIOD_COMPARISON_PCT', 'month')).toBe(
				'Sum Total Sales % MoM'
			);
		});
	});
});
