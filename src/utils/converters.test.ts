import { describe, expect, it, test } from "vitest";
import { getConvertedUnit, roundNumber } from "./converters";

describe("converters", () => {
  describe("edge cases", () => {
    it("should handle zero value", () => {
      expect(() => getConvertedUnit(0, "г")).toThrow("Значение не может быть нулевым");
    });

    it("should handle negative value", () => {
      expect(() => getConvertedUnit(-100, "г")).toThrow("Значение не может быть отрицательным");
    });
  });
  describe("roundNumber", () => {
    describe("default rounding (2 decimal places)", () => {
      test.each([
        [123.456, 123.46],
        [123.454, 123.45],
        [0.0049, 0],
        [0.005, 0.01],
        [999.999, 1000],
        [-123.456, -123.46],
        [-123.454, -123.45],
        [-0.005, -0.01],
        [123, 123],
        [0, 0],
      ])("should round %f to %f", (value, expected) => {
        expect(roundNumber(value)).toBe(expected);
      });
    });

    describe("custom decimal places", () => {
      test.each([
        // Positive decimal places
        [123.4567, 3, 123.457],
        [123.45, 1, 123.5],
        [123.45678, 4, 123.4568],
        [123.45678, 0, 123],

        // Negative decimal places
        [123.456, -1, 120],
        [127.13, -1, 130],
        [1234.56, -2, 1200],
        [1750, -3, 2000],
        [-127.13, -1, -130],
      ])("should round %f with %i decimal places to %f", (value, decimalPlaces, expected) => {
        expect(roundNumber(value, decimalPlaces)).toBe(expected);
      });
    });

    describe("special cases", () => {
      it("should handle NaN", () => {
        expect(roundNumber(NaN)).toBeNaN();
      });

      test.each([
        [Infinity, Infinity],
        [-Infinity, -Infinity],
        [1.23456e20, 1.23456e20],
        [1.23456e-20, 0],
      ])("should handle %f", (value, expected) => {
        expect(roundNumber(value)).toBe(expected);
      });
    });
  });

  describe("getConvertedUnit", () => {
    describe("valid conversions", () => {
      test.each([
        // Weight
        [250, "г", { unitLabel: "1 кг", multiplier: 4 }],
        [500, "г", { unitLabel: "1 кг", multiplier: 2 }],
        [1000, "г", { unitLabel: "1 кг", multiplier: 1 }],
        [1, "кг", { unitLabel: "1 кг", multiplier: 1 }],
        [0.5, "кг", { unitLabel: "1 кг", multiplier: 2 }],
        [2.5, "кг", { unitLabel: "1 кг", multiplier: 0.4 }],
        [500, "гр", { unitLabel: "1 кг", multiplier: 2 }],

        // Volume
        [300, "мл", { unitLabel: "1 л", multiplier: 3.3333333333333335 }],
        [500, "мл", { unitLabel: "1 л", multiplier: 2 }],
        [1000, "мл", { unitLabel: "1 л", multiplier: 1 }],
        [1, "л", { unitLabel: "1 л", multiplier: 1 }],
        [0.75, "л", { unitLabel: "1 л", multiplier: 1.3333333333333333 }],

        // Pieces
        [1, "шт", { unitLabel: "1 шт", multiplier: 1 }],
        [2, "шт", { unitLabel: "1 шт", multiplier: 0.5 }],
        [3, "шт", { unitLabel: "1 шт", multiplier: 0.3333333333333333 }],
        [4, "шт", { unitLabel: "1 шт", multiplier: 0.25 }],
        [10, "шт", { unitLabel: "1 шт", multiplier: 0.1 }],
        [1, "шт.", { unitLabel: "1 шт", multiplier: 1 }],
        [4, "шт.", { unitLabel: "1 шт", multiplier: 0.25 }],

        // Weight
        [950, "г", { unitLabel: "1 кг", multiplier: 1.0526315789473684 }],
        [450, "г", { unitLabel: "1 кг", multiplier: 2.2222222222222223 }],
        [75, "г", { unitLabel: "1 кг", multiplier: 13.333333333333334 }],
        [3, "кг", { unitLabel: "1 кг", multiplier: 0.3333333333333333 }],
        [2.7, "кг", { unitLabel: "1 кг", multiplier: 0.37037037037037035 }],

        // Volume
        [930, "мл", { unitLabel: "1 л", multiplier: 1.075268817204301 }],
        [970, "мл", { unitLabel: "1 л", multiplier: 1.0309278350515465 }],
        [800, "мл", { unitLabel: "1 л", multiplier: 1.25 }],
        [906, "мл", { unitLabel: "1 л", multiplier: 1.1037527593818983 }],
        [1.947, "л", { unitLabel: "1 л", multiplier: 0.5136106831022085 }],
        [1.4, "л", { unitLabel: "1 л", multiplier: 0.7142857142857143 }],
        [2, "л", { unitLabel: "1 л", multiplier: 0.5 }],

        // Price per 100g
        [100, "г", { unitLabel: "1 кг", multiplier: 10 }],
      ])("should convert %i %s to standard unit", (value, unit, expected) => {
        expect(getConvertedUnit(value, unit)).toEqual(expected);
      });
    });

    describe("error handling", () => {
      it("should throw for zero value", () => {
        expect(() => getConvertedUnit(0, "г")).toThrow("Значение не может быть нулевым");
      });

      it("should throw for negative value", () => {
        expect(() => getConvertedUnit(-100, "г")).toThrow("Значение не может быть отрицательным");
      });

      it("should throw for unknown unit", () => {
        expect(() => getConvertedUnit(5, "unknown")).toThrow("Неизвестная единица: unknown");
      });

      it("should throw for empty unit", () => {
        expect(() => getConvertedUnit(5, "")).toThrow("Неизвестная единица: ");
      });

      it("should throw for space unit", () => {
        expect(() => getConvertedUnit(5, " ")).toThrow("Неизвестная единица:  ");
      });
    });
  });
});
