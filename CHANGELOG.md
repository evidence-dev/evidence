# Evidence

## Nov 26 Release

### New chart library

- New chart API built on top of Apache ECharts library
- Grouped bar and stacked area chart types
- Default prop assumptions for `x` and `y` column inputs
- Support for multiple `y` columns
- Composable charts (`<Chart>` component + building blocks)
- Custom charts (`<ECharts>` component, which accepts a custom chart configuration object)
- Refined chart theme and color palette
- Fixed chart area and axis label spacing/overlap issues
- Interactive elements:
  - Tooltips
  - Series focus on hover
  - Paginated legend (when series count is high)

#### Component Changes

| Old         | New       |
| ----------- | --------- |
| ColumnChart | BarChart  |
| Hist        | Histogram |

#### Prop Changes

| Chart       | Old Prop            | New Prop              |
| ----------- | ------------------- | --------------------- |
| All         | units               | yAxisTitle            |
| All         | fillTransparency    | fillOpacity           |
| All         | outlineTransparency | outlineOpacity        |
| All         | legend = top / none | legend = true / false |
| LineChart   | lineTransparency    | lineOpacity           |
| LineChart   | lineDashSize        | lineType              |
| BubbleChart | minPointSize        | minSize               |
| BubbleChart | maxPointSize        | maxSize               |

#### Deprecated Props

| Chart     | Deprecated Prop |
| --------- | --------------- |
| Hist      | binCount        |
| LineChart | lineLabel       |

#### New Props

Please see docs for full list of props

### Move to single dependency

- Moved to a single dependency, which will make installation and updates a lot more reliable
  - Only dependency for an Evidence project is now **@evidence-dev/evidence**
