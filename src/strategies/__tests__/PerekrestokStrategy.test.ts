import { describe } from "vitest";
import { PerekrestokStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("PerekrestokStrategy", () => {
  const strategy = new PerekrestokStrategy();
  const testCards = loadAllTestCards("perekrestok");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
