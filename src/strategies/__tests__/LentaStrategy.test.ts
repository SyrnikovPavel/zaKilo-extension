import { LentaStrategy } from "@/strategies";
import type { NoneUnitLabel, UnitLabel } from "@/types/IStrategy";
import { isNoneUnitLabel, isUnitLabel } from "@/types/IStrategy";
import { roundNumber } from "@/utils/converters";
import { describe, expect, it } from "vitest";
import { loadAllTestCards } from "../__test_data__/loadTestData";

describe("LentaStrategy", () => {
  const strategy = new LentaStrategy();
  const testCards = loadAllTestCards("lenta");

  testCards.forEach((testCard: any, index: number) => {
    describe(`Card ${index + 1}`, () => {
      const cardEl = document.createElement("div");
      cardEl.innerHTML = testCard.html;

      const quantity: NoneUnitLabel | UnitLabel = strategy.parseQuantity(cardEl);

      if (isNoneUnitLabel(quantity)) {
        it("should render 'no info' label correctly when weight not found", () => {
          strategy.renderNoneUnitPrice(cardEl);

          const renderedUnitPrice: HTMLElement = cardEl.querySelector('[data-testid="unit-price"]') as HTMLElement;
          expect(renderedUnitPrice).toBeTruthy();
          expect(renderedUnitPrice?.textContent).toBe("Нет инф.");
        });
      }


      if (isUnitLabel(quantity)) {


      it("should parse price correctly", () => {
        const price = strategy.parsePrice(cardEl);
        expect(roundNumber(price, 1)).toBe(testCard.expectedParsedPrice);
      });
        
        it("should render unit price correctly", () => {
          const { price, label, styles: expectedStyles } = testCard.expectedUnitPrice;

          const calculatedPrice = testCard.expectedParsedPrice * testCard.expectedParsedQuantity.multiplier;
          strategy.renderUnitPrice(cardEl, calculatedPrice, label);

          const renderedUnitPrice: HTMLElement = cardEl.querySelector('[data-testid="unit-price"]') as HTMLElement;
          expect(renderedUnitPrice).toBeTruthy();
          expect(renderedUnitPrice?.textContent).toBe(`${price}\u2009₽/${label}`);

          const styles = window.getComputedStyle(renderedUnitPrice as HTMLElement);

          // Check that all expected styles are applied
          Object.entries(expectedStyles).forEach(([property, value]) => {
            expect(styles[property as keyof CSSStyleDeclaration]).toBe(value);
          });

          const priceAndButtons = cardEl.querySelector(".price-and-buttons");
          const priceBlock = priceAndButtons?.querySelector(".product-price");
          const buttonBlock = priceAndButtons?.querySelector(".ng-star-inserted:has(lu-counter-first-add)");

          expect(priceBlock?.nextElementSibling).toBe(renderedUnitPrice);
          expect(renderedUnitPrice?.nextElementSibling).toBe(buttonBlock);
        });
      }
    });
  });
});
