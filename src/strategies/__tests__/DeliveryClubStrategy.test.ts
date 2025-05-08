import { describe } from "vitest";
import { DeliveryClubStrategy } from "@/strategies";
import { loadAllTestCards } from "../__test_data__/loadTestData";
import { generalCardTest } from "@/strategies/__tests__/generalTest";

describe("DeliveryClubStrategy", () => {
  const strategy = new DeliveryClubStrategy();
  const testCards = loadAllTestCards("delivery-club");

  const currentCardTest = generalCardTest(strategy);
  testCards.forEach(currentCardTest);
});
