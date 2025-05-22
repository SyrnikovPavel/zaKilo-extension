import { OzonStrategy } from "@/strategies";
import { generalCardTest } from "@/strategies/__tests__/generalTest";
import { describe } from "vitest";
import { loadAllTestCards } from "../__test_data__/loadTestData";

describe("OzonStrategy", () => {
  const strategy = new OzonStrategy();
  const testCards = loadAllTestCards("ozon");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
