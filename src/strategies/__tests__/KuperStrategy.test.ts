import { KuperStrategy } from "@/strategies";
import { generalCardTest } from "@/strategies/__tests__/generalTest";
import { describe } from "vitest";
import { loadAllTestCards } from "../__test_data__/loadTestData";

describe("KuperStrategy", () => {
  const strategy = new KuperStrategy();
  const testCards = loadAllTestCards("kuper");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
