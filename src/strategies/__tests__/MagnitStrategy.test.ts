import { describe } from "vitest";
import { MagnitStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("MagnitStrategy", () => {
  const strategy = new MagnitStrategy();
  const testCards = loadAllTestCards("magnit");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
