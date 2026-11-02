# Range Calendar Grain QA

One calendar per `grain`, for checking by hand that clicks select whole periods and that the SQL below each calendar only ever covers whole periods. Set `date.first_day_of_week` in `evidence.config.yaml` to check Monday weeks.

## Day (the default, unchanged)

{% range_calendar id="day_dates" title="Day" /%}

`{{day_dates.between}}` · `.range` = {{day_dates.range}}

## Week

The first click selects the whole week; a second click extends the selection, in either direction.

{% range_calendar id="week_dates" title="Week" grain="week" value_column="date" /%}

`{{week_dates.between}}` · `.range` = {{week_dates.range}}

{% bar_chart data="demo.daily_orders" x="date" y="sum(total_sales)" date_grain="week" filters=["week_dates"] /%}

## Month, with a default that doesn't line up

Mid-month dates are widened to whole months (the editor warns about it): this default applies January through March 2025. A preset that doesn't line up, like `last 30 days`, is widened the same way, and the button then shows the widened months instead of the preset's name.

{% range_calendar id="month_dates" title="Month" grain="month" default_range="2025-01-15 to 2025-03-10" value_column="date" /%}

`{{month_dates.between}}` · `.range` = {{month_dates.range}}

{% bar_chart data="demo.daily_orders" x="date" y="sum(total_sales)" date_grain="month" filters=["month_dates"] /%}

## Quarter

{% range_calendar id="quarter_dates" title="Quarter" grain="quarter" default_range="previous 4 quarters" /%}

`{{quarter_dates.between}}` · `.range` = {{quarter_dates.range}}

## Year

{% range_calendar id="year_dates" title="Year" grain="year" /%}

`{{year_dates.between}}`

## Grain from a date_grain_selector

Changing the grain re-snaps the same selection without widening it further each time.

{% date_grain_selector id="grain_selector" preset_values=["week", "month", "quarter", "year"] default_value="month" /%}

{% range_calendar id="variable_dates" title="Dates" grain={{grain_selector}} value_column="date" default_range="2025-03-15 to 2025-08-20" /%}

`{{variable_dates.between}}` · `.grain` = {{variable_dates.grain}}

{% line_chart data="demo.daily_orders" x="date" y="sum(total_sales)" date_grain={{variable_dates.grain}} filters=["variable_dates"] /%}
