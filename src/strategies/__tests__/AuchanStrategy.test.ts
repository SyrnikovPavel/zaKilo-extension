import { describe } from "vitest";
import { AuchanStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("AuchanStrategy", () => {
  const strategy = new AuchanStrategy();
  const testCards = loadAllTestCards("auchan");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
