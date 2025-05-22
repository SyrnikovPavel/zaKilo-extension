import { isNoneUnitLabel, isUnitLabel, type NoneUnitLabel, type UnitLabel } from "./IStrategy";

describe("IStrategy", () => {
  it("should check NoneUnitLabel", () => {
    const unitLabel: NoneUnitLabel = {
      unitLabel: null,
      multiplier: null,
    } as NoneUnitLabel;

    expect(isNoneUnitLabel(unitLabel)).toBe(true);
  });

  it("should check UnitLabel", () => {
    const unitLabel: UnitLabel = {
      unitLabel: "kg",
      multiplier: 1,
    } as UnitLabel;
    expect(isUnitLabel(unitLabel)).toBe(true);
  });
});
