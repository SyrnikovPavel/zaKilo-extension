import { AuchanStrategy } from "@/strategies";
import { generalCardTest } from "@/strategies/__tests__/generalTest";
import { describe } from "vitest";
import { loadAllTestCards } from "../__test_data__/loadTestData";

describe("AuchanStrategy", () => {
  const strategy = new AuchanStrategy();
  const testCards = loadAllTestCards("auchan");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
