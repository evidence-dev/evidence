import { isAutoFormat } from "../modules/autoFormatting";

test("isAutoFormat(format) = false for incorrect formats", () => {
  expect(isAutoFormat("auto")).toBe(false);
  expect(isAutoFormat({ auto: "auto" })).toBe(false);
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
});