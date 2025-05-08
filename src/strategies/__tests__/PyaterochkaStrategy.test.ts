import { describe } from "vitest";
import { PyaterochkaStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("PyaterochkaStrategy", () => {
  const strategy = new PyaterochkaStrategy();
  const testCards = loadAllTestCards("pyaterochka");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
