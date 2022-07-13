
import * as ssf from "ssf";
import { isAutoFormat, defaultFormat } from "../modules/autoFormatting";

test("isAutoFormat(format) = false for incorrect formats", () => {
  expect(isAutoFormat("auto")).toBe(false);
  expect(isAutoFormat({ auto: "auto" })).toBe(false);
  expect(isAutoFormat({ formatCode: "auto" })).toBe(false); // missing _autoFormat attribute
});

test("isAutoFormat(format) = true for correct auto format", () => {
  expect(
    isAutoFormat({
      formatCode: "auto",
      _autoFormat: {
        autoFormatCode: "YYYY-MM-DD",
      },
    })
  ).toBe(true);

  expect(
    isAutoFormat({
      formatCode: "auto",
      _autoFormat: {
        autoFormatFunction: (value) => value,
      },
    })
  ).toBe(true);
});


test("defaultFormat for numbered value with columnUnitSummary is correct", () => {
  let columnUnitSummary = {
    min: -30000.1,
    max: 99000000.1,
    median: 90000.00,
    maxDecimals: 7,
  };
  expect(defaultFormat(9000.00, columnUnitSummary)).toBe("9.00k");
  expect(defaultFormat(12345.678, columnUnitSummary)).toBe("12.34k");
  expect(defaultFormat(1234.567, columnUnitSummary)).toBe("1.23k");
  expect(defaultFormat(123.456, columnUnitSummary)).toBe("0.12k");
  expect(defaultFormat(12.34, columnUnitSummary)).toBe("0.01k");
  expect(defaultFormat(-123.4, columnUnitSummary)).toBe("-0.01k");
  expect(defaultFormat(-1234.56, columnUnitSummary)).toBe("-1.23k");
  expect(defaultFormat(-12345.67, columnUnitSummary)).toBe("-12.34k");

  expect(defaultFormat(99000000.1, columnUnitSummary)).toBe("99000.00k");
  expect(defaultFormat(30000.1, columnUnitSummary)).toBe("99000.00k");

  //test rounding
  expect(defaultFormat(0, columnUnitSummary)).toBe("-12.34k");
});

test("defaultFormat for undefined or null values is -", () => {
  let columnUnitSummary = {
    min: -30000.1,
    max: 99000000.1,
    median: 90000.00,
    maxDecimals: 7,
  };
  expect(defaultFormat(null, columnUnitSummary)).toBe("-");
  expect(defaultFormat(undefined, columnUnitSummary)).toBe("-");

  expect(defaultFormat(0, columnUnitSummary)).toBe("0.00k");
});