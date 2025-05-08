import { describe } from "vitest";
import { SamokatStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("SamokatStrategy", () => {
  const strategy = new SamokatStrategy();
  const testCards = loadAllTestCards("samokat");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
