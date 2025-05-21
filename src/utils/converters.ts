import type { UnitLabel } from "@/types/IStrategy";
import type { Measure, Unit } from "convert-units";
import convert from "convert-units";

// Types
type RussianUnit = keyof typeof rusToConvertUnit;
type ConvertUnit = (typeof rusToConvertUnit)[RussianUnit];
type TargetUnit = Extract<ConvertUnit, "kg" | "l" | "ea">;
type ConverssionsMeasures = Extract<Measure, "mass" | "volume"> | "ea";
type MeasurableUnit = Exclude<ConvertUnit, "ea">;

// Error messages
const ERROR_MESSAGES = {
  ZERO_VALUE: "Значение не может быть нулевым",
  NEGATIVE_VALUE: "Значение не может быть отрицательным",
  UNKNOWN_UNIT: (unit: string) => `Неизвестная единица: ${unit}`,
  UNKNOWN_MEASURE: (measure: string) => `Неизвестная категория единицы: ${measure}`,
  UNSUPPORTED_TARGET: (target: string) => `Неподдерживаемая целевая единица: ${target}`,
} as const;

// Constants
const rusToConvertUnit = {
  г: "g",
  гр: "g",
  кг: "kg",
  мл: "ml",
  л: "l",
  шт: "ea",
  "шт.": "ea",
} as const;

const measureToTargetUnit: Record<ConverssionsMeasures, ConvertUnit> = {
  mass: "kg",
  volume: "l",
  ea: "ea",
} as const;

const targetUnitLabels: Record<TargetUnit, string> = {
  kg: "1 кг",
  l: "1 л",
  ea: "1 шт",
} as const;

/**
 * Rounds a number to the specified number of decimal places
 */
export function roundNumber(value: number, decimalPlaces: number = 2): number {
  const factor = Math.pow(10, decimalPlaces);
  const rounded = Math.round(Math.abs(value) * factor) / factor;
  return value < 0 ? -rounded : rounded;
}

/**
 * Converts a value from one unit to another with proper labeling
 * @param value - The numeric value to convert
 * @param unit - The source unit (in Russian)
 * @returns Converted unit with label and multiplier
 * @throws {Error} If conversion is not possible
 */
export function getConvertedUnit(value: number, unit: string): UnitLabel {
  validateInputValue(value);

  const normalizedUnit = normalizeUnit(unit);

  if (normalizedUnit === "ea") {
    return convertEachUnit(value);
  }

  return convertMeasurableUnit(value, normalizedUnit as MeasurableUnit);
}

/**
 * Validates input value for conversion
 * @throws {Error} If value is invalid
 */
function validateInputValue(value: number): void {
  if (value === 0) {
    throw new Error(ERROR_MESSAGES.ZERO_VALUE);
  }
  if (value < 0) {
    throw new Error(ERROR_MESSAGES.NEGATIVE_VALUE);
  }
}

/**
 * Normalizes Russian unit name to internal representation
 * @throws {Error} If unit is unknown
 */
function normalizeUnit(unit: string): ConvertUnit {
  const key = unit.trim().toLowerCase() as RussianUnit;
  const normalizedUnit = rusToConvertUnit[key];

  if (!normalizedUnit) {
    throw new Error(ERROR_MESSAGES.UNKNOWN_UNIT(unit));
  }

  return normalizedUnit;
}

/**
 * Gets target unit information for a given measure
 * @throws {Error} If measure is unknown
 */
function getTargetUnitInfo(measure: ConverssionsMeasures): { target: TargetUnit; label: string } {
  const target = measureToTargetUnit[measure];

  if (!target) {
    throw new Error(ERROR_MESSAGES.UNKNOWN_MEASURE(measure));
  }
  if (!(target in targetUnitLabels)) {
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_TARGET(target));
  }

  return {
    target: target as TargetUnit,
    label: targetUnitLabels[target as TargetUnit],
  };
}

/**
 * Converts each unit (штуки)
 */
function convertEachUnit(value: number): UnitLabel {
  return {
    unitLabel: targetUnitLabels.ea,
    multiplier: 1 / value,
  };
}

/**
 * Converts measurable units (mass, volume)
 */
function convertMeasurableUnit(value: number, unit: MeasurableUnit): UnitLabel {
  const desc = convert().describe(unit as Unit) as { measure: ConverssionsMeasures };
  const { target, label } = getTargetUnitInfo(desc.measure);

  const convertedValue = convert(value)
    .from(unit as Unit)
    .to(target as Unit);

  return {
    unitLabel: label,
    multiplier: 1 / convertedValue,
  };
}
