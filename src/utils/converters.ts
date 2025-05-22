import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";

/**
 * Rounds a number to the specified number of decimal places
 * @param value - The number to round
 * @param decimalPlaces - The number of decimal places to round to (default: 2)
 *                      - If negative, rounds to tens, hundreds, etc.
 * @returns The rounded number
 */
export function roundNumber(value: number, decimalPlaces: number = 2): number {
  const factor = Math.pow(10, decimalPlaces);
  const rounded = Math.round(Math.abs(value) * factor) / factor;
  return value < 0 ? -rounded : rounded;
}

export function getUnitParsedWeight(value: number, unit: string): UnitLabel | NoneUnitLabel {
  if (value === 0) {
    return { unitLabel: null, multiplier: null } as NoneUnitLabel;
  }
  if (value < 0) {
    return { unitLabel: null, multiplier: null } as NoneUnitLabel;
  }
  switch (unit) {
    case "г":
    case "гр":
      return { unitLabel: "1 кг", multiplier: 1000 / value } as UnitLabel;
    case "кг":
      return { unitLabel: "1 кг", multiplier: 1 / value } as UnitLabel;
    case "мл":
      return { unitLabel: "1 л", multiplier: 1000 / value } as UnitLabel;
    case "л":
      return { unitLabel: "1 л", multiplier: 1 / value } as UnitLabel;
    case "шт":
    case "шт.":
      return { unitLabel: "1 шт", multiplier: 1 / value } as UnitLabel;
    default:
      return { unitLabel: null, multiplier: null } as NoneUnitLabel;
  }
}
