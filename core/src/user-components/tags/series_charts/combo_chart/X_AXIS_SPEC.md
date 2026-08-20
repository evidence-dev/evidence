# X-Axis Specification

How the combo-chart x-axis decides its type, ticks, labels, and layout from the
data and attributes it's given. Every rule here is deterministic — a pure
function of (column type, `date_grain`, data values, axis options, container
width). If a chart's axis looks wrong, walk this document top to bottom and
find the first rule that misfired.

Implementation lives in:

- `x-axis-rules.ts` — the pure decision rules and their thresholds (steps 1–4);
  unit-tested in isolation in `x-axis-rules.test.ts`
- `XAxisModel.svelte.ts` — the reactive assembler: feeds query results and
  options into the rules and lays the output into ECharts option shape
- `format-time-axis-label.ts` — label text rules (step 5)
- `infer-grain-from-timestamps.ts` — cadence inference (step 2)
- `../echarts/echarts-utils.ts` — width-aware layout: rotation and thinning (step 6)
- `../../../common/fill-gaps.ts` — series gap-filling (related, but a separate
  system; see "Interaction with series fill")

---

## 1. Axis type

Input: the x column's `jsType` from query metadata, plus `date_grain`.

| Condition                                                                                                | Axis type                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `date_grain = 'year'`                                                                                    | `category` — a handful of discrete year buckets reads better than a continuous time axis                          |
| named seasonality `date_grain` (`day of week`, `month of year`, `quarter of year`)                       | `category` — labels are names (Mon, Jan, Q1); a category axis shows every slot, so no dropped Jan/Mon             |
| numeric seasonality `date_grain` (`day of month`, `week of year`, `day of year`) and `jsType = 'number'` | `value` — labels are numbers, so ECharts' nice-tick placement reads naturally; `minInterval: 1` keeps ticks whole |
| `jsType = 'date'`                                                                                        | `time`                                                                                                            |
| `jsType = 'number'`                                                                                      | `value`                                                                                                           |
| `jsType = 'string'`                                                                                      | `category`                                                                                                        |

Sections 2–5 (§ 5.1 excepted) apply only to `time` axes. Non-time axes take
their label text from § 5.1. Section 6 applies to `category` (auto-rotate path)
and `time` (thinning path).

## 2. Effective grain (time axes)

The single source of truth used by both the tick strategy and the label
formatter. Priority order:

1. **Explicit `date_grain`** — the author declared the cadence. Trust it.
2. **Inferred from data cadence** — smallest positive delta between adjacent
   x-timestamps across all series (`inferGrainMsFromTimestamps`), snapped to a
   named grain by `closestNamedGrain`:
   - `< 20h` → `hour` (20h, not 24h: keeps 23h DST-spring deltas in `day`,
     12h semidaily in `hour`)
   - `< 15d` → `day` (weekly cadence deliberately buckets to `day`)
   - `< 200d` → `month` (quarterly and half-yearly bucket to `month`)
   - else → `year`
3. **Short-span hour promotion** — no `date_grain`, data span `< 2 days` →
   `hour`. Prevents raw sub-day timestamps from flipping label vocabulary
   between day and hour on the same axis.

If all three produce nothing (e.g. a single data point with no grain), the
label formatter falls back to per-tick inference (`inferGrain` in
`format-time-axis-label.ts`), which reads a single date's components. That
fallback never returns `week` or `quarter`, and only returns `hour` when
minutes/seconds are non-zero — a bare non-zero hour is a calendar date carrying
an offset, not hourly data (the "4 am bug" guard).

## 3. Tick strategy (time axes)

Two regimes, chosen by data-point count:

### Pinned ticks (`customValues`) — ≤ 15 positions

Each tick sits exactly on a data position. One label per bar/point. Applied to
both `axisLabel.customValues` and `axisTick.customValues`. Requires ECharts
≥ 6.1.0 (customValues on time axes).

The tick positions are built in two steps:

1. **Raw positions**: sorted, deduped x-timestamps from every series' query
   rows (`seriesTimestamps`).
2. **Grain fill**: when an effective grain exists, walk from data-min to
   data-max one grain unit at a time (`walkGrainTicks`) and use those
   positions instead — so a monthly chart missing July still shows a labeled
   July slot. Whether a bar renders there is the series layer's business (see
   "Interaction with series fill"); the axis label appears either way.

   Grain-fill output is **rejected** (falling back to raw positions) when:
   - it exceeds 15 positions (the tick budget), or
   - for **inferred** grains only, it exceeds `3 × raw count` — a guard
     against a mis-inferred grain ballooning 2 yearly points into 730 daily
     ticks. An explicit `date_grain` skips this guard: there's no inference
     to distrust, so sparse data (3 monthly readings across 11 months) still
     labels every month.

3. **Walker mechanics**: local-time Date arithmetic (`setMonth`, `setDate`,
   `setHours`) so month lengths and DST roll over correctly; hard cap of 500
   iterations.

Pinned-tick axes also set:

- `boundaryGap: ['2%', '2%']` (symmetric) — the asymmetric default leaves the
  first pinned label close enough to the plot edge that ECharts clips it.
- `showMinLabel` / `showMaxLabel: true` — edge labels carry the strongest
  orientation context and must survive thinning.
- `hideOverlap: false` — ECharts' greedy collision-dropper picks arbitrary
  victims and produces uneven spacing; uniform thinning is handled in step 6
  instead.

### Verbose labels — ≤ 6 positions

Within the pinned regime, at very small counts every label gets full context
("May 31, Jun 7, Jun 14" instead of "May 31, 7, 14"). There's room, and the
compact form reads ambiguously with so few siblings.

### ECharts-native ticks — > 15 positions

ECharts places and thins its own round-number ticks. `hideOverlap: true`,
`showMinLabel`/`showMaxLabel` deferred to ECharts' hierarchical labeling. Our
formatter still supplies label text (section 5), so vocabulary stays
consistent between the two regimes.

## 4. Bounds

- User `min`/`max` always win (coerced: numbers pass through; strings parse as
  dates on time axes).
- **Value x-axes fit to data by default** (`fit_to_data` defaults to `true`
  when the axis type is `value`). The x-axis is the domain, not the measure —
  zero-anchoring years 1995-2002 produces an axis spanning 0-2500 with the
  data crammed into the last 2%. Bars-start-at-zero applies to the measure
  axis (y; horizontal bar charts build their value axis from `YAxisModel`).
  `fit_to_data=false` opts back into zero-inclusion.
- Value axes with entirely non-negative data never show a negative min:
  - fit-to-data (the default): min hugs the data with a 2% pad, floored at 0
  - `fit_to_data=false`: min pinned to 0
  - mixed-sign data: ECharts default behavior, untouched
- Fit-to-data value axes also pin the **max** to data max + 2% pad
  (`makeFitToDataValueAxisMax`). Without it, ECharts rounds the padded max up
  to the next whole tick — data ending at 2019 with a 3-year tick interval
  produced an axis ending at 2022, ~3 years of dead space against the min
  side's tight 2%, reading as lopsided.
- **Integer domains snap padded bounds to whole numbers** (both sides,
  floor min / ceil max when data min AND max are integers) so the extent
  itself is never fractional.
- **Padded boundary ticks are never labelled** (`isOutsideDataRange`): the
  fit pad puts the axis bounds slightly outside the data (2000-2019 →
  1999/2020) and ECharts labels boundary ticks — phantom values the data
  doesn't contain, which also crowd out the real first tick under
  `hideOverlap`. Value-axis labels for ticks outside the data range render
  as empty strings. Only applies when the pad is ours — user `min`/`max`
  and zero-pinned (non-fit) axes label their full range.
- **User `interval` disables the pad** (exact data bounds). ECharts anchors
  explicit-interval ticks at the axis min, so a padded min of 1999 makes
  `interval=2` tick odd years (2001, 2003…) against even-year data.
- **Non-temporal integer grains get half-slot bounds**
  (`makeIntegerSlotBounds`: data min − 0.5 / data max + 0.5). These are
  discrete slot domains (`month of year` 1-12, `day of week` 1-7, …) — the
  proportional pad + integer snap misfires: ceil(12 + 2%·span) = 13 appends a
  phantom 13th-month slot whose label wraps around to "Jan" (SSF month
  formatting is modular). Half a unit per side gives the extreme bars a full
  slot, matching category-axis geometry; the x.5 boundary ticks fall outside
  the data range so blanking leaves them unlabeled. User `min`/`max` still
  win.
- `boundaryGap`: category `true`; time with pinned ticks `['2%','2%']`;
  otherwise `['1%','2%']`.

## 5. Label text (time axes without user `fmt`)

`formatTimeAxisLabel` — all arithmetic local-time (see § Timezone rules). Rules
in priority order:

0. **Span split for month/quarter** (and the multi-year first tick of every
   grain), keyed on `spansMultipleYears` (data min/max fall in different calendar
   years) and `compactYearRollover` (data span `≥ 400 days`):
   - **Single calendar year** (every tick shares one year — Apr–Jun 2026, or a
     full Jan–Dec 2024) month/quarter drop the year **entirely**: bare
     single-line periods ("Apr", "May", "Jun"). The year is constant across the
     axis, so stating it — even once — is redundant context; it belongs in the
     title, not on every-viewer axis furniture. No first-tick anchor, and no
     reserved year-line gutter (`hasTwoTierLabels` is false).
   - **~1 year across a boundary** (Jul 2024 – Jun 2025) month/quarter are
     **two-tier**: period names on the label line ("Jul", "Q3"), the year on a
     second line at the first tick and each January/Q1 rollover ("Jul\n2024",
     "Q1\n2025"). The year now varies, so it must appear. Publication style
     guides (Datawrapper, SWD) state each year once as a super-category rather
     than inflating individual labels; the two-line form keeps every label at
     period-name width, so a wide "Jan 2025" anchor never sets the layout
     budget. (Ignores `verbose` — the second line solves single-line width
     structurally.)
   - **Multi-year is a year timeline** and reads **single-line, year-anchored**:
     ECharts thins it to ~yearly ticks. Each January/Q1 boundary shows the
     **bare year** ("2024") — stacking an identical "Jan"/"Q1" over every one is
     noise; interior ticks show the bare period ("Apr", "Q3"); the first tick,
     if it isn't itself a boundary, shows an inline "Q3 2023" to state the start
     year. Day/week grains likewise anchor their multi-year first tick to the
     year ("2022", or "Mar 2022" for a mid-year start) instead of a stray
     day-qualified "Jan 1". A multi-year axis therefore never reserves the
     two-tier year-line gutter (`hasTwoTierLabels` is false).
1. **Verbose mode** (≤ 6 ticks): every tick gets the first-tick treatment.
2. **First tick** gets orientation context — "Jun 5" not "5". Detected by
   `index === 0` OR proximity to data-min within half a
   grain unit on either side (ECharts sometimes hides a phantom padding tick,
   or places the first visible tick slightly before data-min). Exception:
   hour grain's first tick shows just the time — ECharts' native two-tier
   rendering already injects the day marker.
3. **Year rollover** (Jan 1, day/week grains): shows the year. Two styles,
   chosen by data span: `≥ 400 days` → compact "2025" (repeats as a rhythmic
   separator); shorter → verbose "Jan 2025" (a lone rollover reads as a point
   in time).
4. **Month rollover**: month name. Grain-specific variants:
   - `hour` grain: midnight ticks show "Jun 15" (date), other hours show
     "4 pm". Jan 1 midnight shows just the year.
   - `week` grain: ticks starting within the first 7 days of a month are the
     month marker — day-1 exactly → "Jul"; otherwise day-qualified "May 7"
     (weekly ticks rarely land on day-1, and bare "May" is ambiguous next to
     numeric siblings); first week of January → "Jan 2025".
5. **Otherwise**: the small unit for the grain — day of month ("17"), hour
   ("4 pm"), month name, "Q3 2024" (quarters always carry the year), year.

Tooltips (`formatTimeAxisTooltip`) always carry full context, and weekly
tooltips render the full range ("Jun 15–21, 2025"). Axis label and tooltip
must agree on the date — both read local components for that reason.

User-provided `fmt` bypasses all of this and formats via `formatValue`/SSF.

## 5.1 Label text (non-time axes without user `fmt`)

`time` axes never reach here (§ 5 owns them). Every OTHER axis with a
`date_grain` — a seasonality grain on a `value` or `category` axis, or `year`
on its `category` axis — takes its label vocabulary from the grain's canonical
format so a grain's labels never depend on the author remembering to pass
`fmt`. Resolved in `XAxisModel`'s `#formatter`:

| Grain (no user `fmt`)                         | Axis       | Label source                                                     | Example                            |
| --------------------------------------------- | ---------- | ---------------------------------------------------------------- | ---------------------------------- |
| `year`                                        | `category` | `extractYear` → bare 4-digit year (date, ISO, ms, or int column) | `2015`, not `2,015` / `2015-01-01` |
| `month of year`                               | `category` | grain default `mmm`                                              | `Jan`…`Dec`                        |
| `day of week`                                 | `category` | grain default `ddd`                                              | `Sun`…`Sat`                        |
| `quarter of year`                             | `category` | grain default `"Q"0`                                             | `Q1`…`Q4`                          |
| `day of month`, `week of year`, `day of year` | `value`    | grain default `num0` — whole integers, never `5.0`               | `5`, `10`, `15`                    |

`year` is special-cased in code (not routed through the `yyyy` default): SSF's
`yyyy` misreads an integer year column (2015) as an Excel serial, and can't
format a bare ISO string without a `Date` first — `extractYear` handles all
four value shapes directly. All other grains delegate to
`getDefaultFormatForDateGrain` (date-options.ts), the same code the docs' `fmt`
examples use, so grain-default and explicit-`fmt` output agree. User `fmt`
always wins. A number/string column with no `date_grain` gets generic
`formatValue` number/string formatting (plus year detection below).

### Value-axis year detection

Integer year columns plotted as plain numbers (`x="year"`, values 1995-2002)
would default to thousands separators — "1,995" reads as a quantity, not a
calendar. When the column NAME ends in year/yr(s) AND the data min/max are
integers within [1000, 3000] (`isYearLikeDomain`), the axis defaults to
separator-free integer formatting and `minInterval: 1` (a fractional tick
would round to a duplicate label). Applied in `#formatter` so tooltips agree
with axis labels. User `fmt` always wins. Requiring both signals keeps false
positives out: scores/elevations in the 4-digit range fail the name check,
year-named columns holding durations fail the value check.

## 6. Width-aware layout (chart-render time)

Runs in `echarts.action.ts` on every render/resize, before `setOption`.

### The label layout matrix

Each axis type has exactly ONE mechanism for labels that don't fit. No axis
mixes truncation, rotation, and hiding — a label's fate is a deterministic
function of axis type and available width:

| Axis type          | Fits       | Doesn't fit                                                                                                                                       | Never                              |
| ------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Time               | all labels | stride-thin (first/last/year anchors kept)                                                                                                        | rotate, truncate, wrap             |
| Value              | nice ticks | fewer nice ticks (ECharts `hideOverlap` on its own uniform ticks)                                                                                 | rotate, truncate, wrap             |
| Category (string)  | all labels | rotate 45° → ellipsis only past the 180px cap (tooltip shows full text) → uniform every-k-th thinning when slots are narrower than a rotated line | horizontal ellipsis, greedy hiding |
| Category (numeric) | all labels | stay horizontal, thin to every k-th                                                                                                               | rotate, truncate, greedy hiding    |

User options always override the automatic branch: `label_rotate` (fixed
angle, `max_label_length` char-truncation with tooltip, default 20),
`label_wrap` (break within the slot width instead of rotating),
`max_label_length` alone (char-truncation at any angle), `labels=false`.

`hideOverlap` is enabled ONLY where ECharts also owns tick placement (value
axes; time axes above the custom-tick threshold) — there its victims are its
own auto-generated ticks, which it drops uniformly. Wherever WE pick the
labels (pinned `customValues`, category axes) it is off, because greedy
collision-dropping against hand-picked labels produces the arbitrary
some-hide-some-don't gaps this matrix exists to prevent.

### Category axes — `withAutoXAxisLabelLayout`

The fit check: widest label (canvas-measured) vs its slot budget
(`container width × 4/5 ÷ label count`).

- **Fits:** every label horizontal and whole. No ECharts `width` is set, so
  horizontal labels can never ellipsize — a mid-width band where labels
  truncated before the rotate breakpoint read as arbitrary (the fit estimate
  and ECharts' internal measurement disagreed by a few pixels).
- **Doesn't fit, numeric-value category:** a stacked bar/area chart on a
  numeric grain (day of month, week of year, …) is coerced to a category axis
  to keep its stacks aligned. Its `1..31` labels overflow their slots but read
  fine horizontally, so they stay at `rotate: 0` and thin to every k-th —
  matching the tidy value-axis look of the same grain's non-stacked line chart.
  ("Numeric" = every distinct x-value parses to a finite number.)
- **Doesn't fit, string category:** rotate 45°, clamp at 180px with ellipsis +
  hover tooltip, request extra chart height for the taller gutter. A rotated
  line's horizontal footprint is `fontSize·√2` regardless of text length; when
  slots are narrower than that, no rotation fits every label, so labels thin
  to every k-th (uniform rhythm) rather than letting `hideOverlap` choose.
- `label_wrap` keeps the slot `width` with `overflow: 'break'` (wrapping
  needs a width to wrap to). A user `rotate` disables the automatic branch.

### Time axes with pinned ticks — `withAutoTimeAxisLabelThinning`

Only fires when `customValues` has > 2 numeric entries. Width measurement is
per-LINE for multi-line labels (a two-tier "Jul\n2019" occupies month-name
width).

**Time axes never auto-rotate — bars included.** On a time axis a bar is a
time bucket, not a category: readers interpolate unlabeled ticks the same way
they do on a line, rotated labels are measurably slower to read, and
publication style guides avoid them on time axes. All mark types get the same
treatment — labels stay horizontal and thin when they stop fitting — so bar,
line, and area charts over the same data share one visual grammar. (Category
axes — true categorical bars — still rotate via `withAutoXAxisLabelLayout`.)

**Thinning** is stride-based: keep every k-th tick, with k the smallest
stride that fits the width budget. A fixed stride gives the axis a steady
calendar rhythm ("Feb, Apr, Jun, Aug") where a greedy closest-fit pick
produced irregular clusters ("Mar, Apr, Jun, Jul, Sep") on forced-anchor or
gappy data. Always kept: first, last, and any two-tier year label
("Jan\n2020") — dropping a year rollover orphans the reader's sense of which
year surrounding months belong to. Stride picks landing within half a stride
of a kept anchor are dropped so an anchor never gains an adjacent sibling
("… Oct, Dec, Jan 2025" yields to "… Oct, Jan 2025").

### Two-tier label geometry

- Line pitch is `TWO_TIER_LABEL_LINE_HEIGHT` (fontSize + 4) via
  `axisLabel.lineHeight`, so the year tier reads as a separate row rather
  than a cramped second line. ECharts aligns single-line siblings with the
  FIRST line of a multi-line label, so the month row stays on one baseline.
- The chart budgets `TWO_TIER_LABEL_EXTRA_GRID_BOTTOM_PX` of extra
  `grid.bottom` when `XAxisModel.hasTwoTierLabels` (month or quarter grain,
  no user `fmt`, labels on). Both constants live in `constants.ts` so pitch
  and budget can't drift apart.
- The CONTAINER grows by that same constant (ComboChart's
  `twoTierExtraHeight`), so the year tier never shrinks the plot area — a
  `height=240` monthly chart keeps the same plot pixels as a daily one.
  This reuses the sizing contract rotated category labels established via
  `xAxisExtraHeight`, but resolves synchronously: two-tier-ness is known
  from the data at option-build time, not discovered during layout passes,
  so there is no resize feedback loop. (The two never combine — two-tier is
  time-axis-only, rotation is category-only.)
- The x-axis title graphic anchors to the container's bottom edge while
  labels hang from the plot's bottom edge; `grid.bottom` (which already adds
  +15 when the title is visible) is what keeps them apart. This holds at any
  chart height because both measurements are fixed pixel offsets from the
  container bottom — verified by rendered-label tests that assert positive
  clearance at 180/240/400px heights.

### End-to-end rendered-label tests

Two suites pin the FINAL output of this whole spec — dataset + container width
→ the exact labels ECharts paints, extracted from its server-side SVG render —
sharing one harness (`x-axis-test-harness.ts`) that runs the real `XAxisModel`,
the real layout helpers (with a stub node of the given `clientWidth`), real
series-value canonicalization (`seriesConfig.formatXValue`), and real ECharts
tick placement:

- **`x-axis-label-matrix.test.ts`** — THE matrix: one enforced cell per
  (column type × grain × density × span × width) combination in this spec, plus
  the cross-cutting knobs that alter label text or rotation — user `fmt` (bypass),
  stacked `forceCategory` coercion, gappy grain-fill, and a mid (~520px) width in
  the fit→thin band. Every grain maps to a known, tested label set, so no
  unhandled case can ship silently. Adding a grain, an axis-type rule, or a
  formatting branch means adding its cells here — this table is the executable
  form of § 1 + § 5 + § 5.1.
- **`x-axis-rendered-labels.test.ts`** — deep-dive scenarios (two-tier geometry,
  title clearance, gap handling, multi-year first-tick anchors, DST) that need
  more than a single labels-array assertion.

When changing anything in this document, add or update cases in both as
appropriate. (Node measures text with the char-count fallback rather than
browser canvas, so thin/rotate breakpoints can sit a few pixels off a real
browser — decisions are deterministic, exact widths are not.)

## Interaction with series fill (`fillGaps`)

Axis ticks and series rows are **decoupled systems** that happen to converge
on the same grain-aligned positions:

| `handle_missing`    | Series rows at a gap                     | Axis tick at a gap                         |
| ------------------- | ---------------------------------------- | ------------------------------------------ |
| `connect` (default) | none — line connects across, bars absent | labeled empty slot (grain fill, section 3) |
| `zero`              | synthetic row with y=0 from `fillGaps`   | same tick; bar/point and label align       |
| `gaps`              | synthetic row with y=null (visual break) | same tick                                  |

Alignment holds because both systems anchor to the raw data's timestamps:

- String dates (`"2024-02-01"`): axis parses via `parseSeriesTimestampMs`
  (any UTC offset stripped, wall-clock digits read as local) everywhere —
  `dataMinMs`, `seriesTimestamps`, and the walker all agree; the value fed to
  ECharts is canonicalized the same way (`canonicalizeTimeAxisValue`), so
  ECharts positions the bar on the identical instant.
- `fillGaps` does pure `YYYY-MM-DD` string arithmetic and emits strings, so
  its synthetic rows parse identically.
- **Deliberate noon-UTC hack**: when raw data arrives as `Date` objects,
  `fillGaps` emits synthetic dates at _noon UTC_ (`T12:00:00Z`), not midnight.
  Noon is equidistant from both midnights, so the calendar date survives
  formatting in any viewer timezone (UTC±12) — midnight-anchored synthetic
  dates displayed as the previous day for viewers behind UTC. The accepted
  cost is a 12h positioning offset between synthetic rows and raw driver
  dates (UTC midnight) on time axes: negligible at month grain and coarser
  (< 2% of a slot), visible in principle at day grain with
  `handle_missing='zero'/'gaps'` on Date-object data. Do not "fix" the noon
  anchor without solving the display-date problem another way.

## Timezone rules

**Same for everyone.** The chart never converts a timestamp to the viewer's
timezone. It shows the wall-clock digits in the data verbatim — a zoneless
`"2024-06-15"` renders as "Jun 15", and a `"2024-06-15T04:00:00Z"` renders as
"4 am", identically for every viewer in every timezone. Any UTC offset ("Z" or
"±hh:mm") is stripped up front, so an offset-bearing value is treated exactly
like the same wall-clock digits with no offset. Customers who bucket in a
chosen zone via SQL (`toTimeZone(...)`) get their chosen wall-clock shown as-is
to everyone; the offset they may or may not carry is irrelevant to the display.

- The offset is stripped in ONE place, `standardizeDateString`, which both
  `parseSeriesTimestampMs` (the tick/label/tooltip pipeline) and
  `canonicalizeTimeAxisValue` (the value handed to ECharts for bar positioning)
  route through. So ECharts never sees an offset either — it parses the
  offset-free wall-clock digits on its default local clock.
- Every string-date parse in the pipeline — `dataMinMs`/`dataMaxMs`
  (`computeTimeDataRangeMs`), customValues (`XAxisModel`), the min/max coercion
  (`coerceAxisValue`), and the label/tooltip formatter's `toDate` — goes through
  `parseSeriesTimestampMs`. Because ECharts parses the canonicalized series data
  the same way, bounds, ticks, tooltips, and bars all land on one instant. A
  mismatch between axis-min and customValues silently drops edge ticks (ECharts
  discards customValues outside the axis range), so this consistency is
  load-bearing.
- Label/tooltip formatting (`format-time-axis-label.ts`): local components,
  matching the positions — so axis label and tooltip agree on the date.
- `walkGrainTicks`: local-time stepping, so a tick lands on the same instant
  ECharts computes for the series data (and DST boundaries don't drift it).
- Because parse-local + format-local cancel and the offset is gone before
  either runs, the bar, its axis label, and its tooltip stay in lockstep and
  read identically regardless of the viewer's timezone: a "…04:00:00Z" point
  reads "4 am" for an EDT viewer, a Tokyo viewer, and everyone else. A genuine
  epoch-ms BIGINT formatted with a date `fmt` is rendered on its UTC calendar
  date (Unix epoch is UTC-anchored) — see `msTimestampToDate` in
  `formatValue.ts`.

**Why local, not UTC.** An empirical probe (NY/Tokyo/Berlin) showed ECharts
places series date-STRINGS on the local clock even when `useUTC: true` — the
flag only affects tick MATH, not series parsing. Pinning UTC therefore split
the clock (local positions, UTC ticks + labels), which is exactly what produced
the "4 am / 4 am / 4 am" axis and off-by-one-day labels for viewers off the UTC
line. Local-everywhere removes the split. A future project-level timezone
setting would live upstream at the SQL/normalize layer (automating the
`toTimeZone(...)` those customers hand-write) and would not change this chart
contract — the chart always displays the wall-clock date it's given.
