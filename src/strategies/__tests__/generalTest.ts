import type { UnitLabel } from "@/types/IStrategy";
import { isNoneUnitLabel, isUnitLabel, type IStrategy } from "@/types/IStrategy";
import { roundNumber } from "@/utils/converters";
import { describe, expect, it } from "vitest";

export const generalCardTest = (strategy: IStrategy) => (testCard: any, index: number) => {
  describe(`Card ${index + 1}`, () => {
    const cardEl = document.createElement("div");
    cardEl.innerHTML = testCard.html;

    const quantity = strategy.parseQuantity(cardEl);

    if (isNoneUnitLabel(quantity)) {
      it("should render 'no info' label correctly when weight not found", () => {
        strategy.renderNoneUnitPrice(cardEl);

        const renderedUnitPrice = cardEl.querySelector('[data-testid="unit-price"]');
        expect(renderedUnitPrice).toBeTruthy();
        expect(renderedUnitPrice?.textContent).toBe("Нет инф.");

        const styles = window.getComputedStyle(renderedUnitPrice as HTMLElement);

        Object.entries(testCard.expectedNoneUnitPrice.styles).forEach(([property, value]) => {
          expect(styles[property as keyof CSSStyleDeclaration]).toBe(value);
        });
      });
    }

    if (isUnitLabel(quantity)) {
      it("should parse quantity correctly", () => {
        const quantity = strategy.parseQuantity(cardEl) as UnitLabel;
        expect(roundNumber(quantity.multiplier, 3)).toEqual(roundNumber(testCard.expectedParsedQuantity.multiplier, 3));
        expect(quantity.unitLabel).toEqual(testCard.expectedParsedQuantity.unitLabel);
      });

      it("should parse price correctly", () => {
        const price = strategy.parsePrice(cardEl);
        expect(roundNumber(price, 1)).toBe(testCard.expectedParsedPrice);
      });

      it("should render unit price correctly", () => {
        const { price, label, styles: expectedStyles } = testCard.expectedUnitPrice;

        const calculatedPrice = testCard.expectedParsedPrice * testCard.expectedParsedQuantity.multiplier;
        strategy.renderUnitPrice(cardEl, calculatedPrice, label);

        const renderedUnitPrice = cardEl.querySelector('[data-testid="unit-price"]');
        expect(renderedUnitPrice).toBeTruthy();
        expect(renderedUnitPrice?.textContent).toBe(`${price}\u2009₽ за ${label}`);

        const styles = window.getComputedStyle(renderedUnitPrice as HTMLElement);

        // Check that all expected styles are applied
        Object.entries(expectedStyles).forEach(([property, value]) => {
          expect(styles[property as keyof CSSStyleDeclaration]).toBe(value);
        });
      });
    }
  });
};
