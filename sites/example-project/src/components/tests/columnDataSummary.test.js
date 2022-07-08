import { getColumnDataSummary } from "../modules/getColumnExtents";

test("getColumnDataSummary returns undefined for none numeric types", () => {
    const data = [
        { column1: 'foo', column2: 3 },
        { column1: 'bar', column2: 'value' },
        { column1: 'far', column2: 4 },

      ];
    const summary = getColumnDataSummary(data, 'column2');
    expect(summary).toBeUndefined();
});

test("getColumnDataSummary returns correct values with typical example", () => {
  const data = [
      { keyColumn: 'foo', valueColumn: 3 },
      { keyColumn: 'bar', valueColumn: 3.1 },
      { keyColumn: 'dar', valueColumn: 3.14159 },
      { keyColumn: 'blah', valueColumn: 1 },
      { keyColumn: 'blah', valueColumn: 5 },
    ];
  const summary = getColumnDataSummary(data, 'valueColumn');
  expect(summary).toStrictEqual({
    min: 1, max: 5, median: 3.1, maxDecimals: 5
  });
});

test("getColumnDataSummary returns correct values when there are undefined and null elements", () => {
  const data = [
      { column1: 'foo', column2: 3 },
      { column1: 'bar', column2: null },
      { column1: 'dar', column2: undefined },
      { column1: 'blah', column2: 1 },
      { column1: 'blah', column2: 5 },
    ];
  const summary = getColumnDataSummary(data, 'column2');
  expect(summary).toStrictEqual({
    min: 1, max: 5, median: 3, maxDecimals: 0
  });
});