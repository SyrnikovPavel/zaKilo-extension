import { describe } from "vitest";
import { OzonStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("OzonStrategy", () => {
  const strategy = new OzonStrategy();
  const testCards = loadAllTestCards("ozon");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
