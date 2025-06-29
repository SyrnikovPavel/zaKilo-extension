import { MetroStrategy } from "@/strategies";
import { describe } from "vitest";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "./generalTest";

describe("MetroStrategy", () => {
  const strategy = new MetroStrategy();
  const testCards = loadAllTestCards("metro");
  testCards.forEach(generalCardTest(strategy));
});
