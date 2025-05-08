import { describe, it, expect, vi, beforeEach } from "vitest";
import { ParserStrategy } from "./ParserStrategy";
import type { UnitLabel } from "@/types/IStrategy";
import { getUnitParsedWeight } from "@/utils/converters";

// Concrete implementation of ParserStrategy for testing
class TestStrategy extends ParserStrategy {
  constructor() {
    super();
    this.strategyName = "TestStrategy";
    this.selectors = {
      card: ".product-card",
      price: ".price",
      name: ".name",
      unitPrice: ".unit-price",
    };
  }

  parsePrice(cardEl: HTMLElement): number {
    const priceEl = cardEl.querySelector(this.selectors.price!);
    if (!priceEl) throw new Error("Price element not found");
    return parseFloat(priceEl.textContent || "0");
  }

  parseQuantity(cardEl: HTMLElement): UnitLabel {
    const nameEl = cardEl.querySelector(this.selectors.name!);
    if (!nameEl) throw new Error("Name element not found");
    const match = (nameEl.textContent || "").match(/(\d+(?:\.\d+)?)\s*(г|кг|мл|л|шт)/);
    if (!match) return { unitLabel: "1 шт", multiplier: 1 };

    const value = parseFloat(match[1]);
    const unit = match[2];

    return getUnitParsedWeight(value, unit);
  }

  renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void {
    const priceEl = cardEl.querySelector(this.selectors.price!);
    if (!priceEl) throw new Error("Price element not found");

    const unitPriceEl = document.createElement("span");
    unitPriceEl.className = "unit-price";
    unitPriceEl.textContent = `${unitPrice.toFixed(2)} ₽ за ${unitLabel}`;
    priceEl.appendChild(unitPriceEl);
  }
}

describe("ParserStrategy", () => {
  let strategy: TestStrategy;
  let mockCard: HTMLElement;

  beforeEach(() => {
    strategy = new TestStrategy();

    // Create a mock card element
    mockCard = document.createElement("div");
    mockCard.className = "product-card";
    mockCard.innerHTML = `
      <div class="price">100</div>
      <div class="name">Test Product 500г</div>
    `;
    document.body.appendChild(mockCard);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should initialize with default values", () => {
    expect(strategy.strategyName).toBe("TestStrategy");
    expect(strategy.selectors.card).toBe(".product-card");
    expect(strategy.selectors.price).toBe(".price");
    expect(strategy.selectors.name).toBe(".name");
    expect(strategy.selectors.unitPrice).toBe(".unit-price");
  });

  it("should get card selector", () => {
    expect(strategy.getCardSelector()).toBe(".product-card");
  });

  it("should throw error if card selector is not defined", () => {
    strategy.selectors.card = "";
    expect(() => strategy.getCardSelector()).toThrow("card selector not defined");
  });

  it("should determine if a card should be processed", () => {
    // Card has price and name but no unit price, so it should be processed
    expect(strategy.shouldProcess(mockCard)).toBe(true);

    const unitPriceEl = document.createElement("span");
    unitPriceEl.className = "unit-price";
    mockCard.appendChild(unitPriceEl);
    expect(strategy.shouldProcess(mockCard)).toBe(false);
  });

  it("should throw error if selectors are not set", () => {
    strategy.selectors = { card: "", price: "", name: "", unitPrice: "" };
    expect(() => strategy.shouldProcess(mockCard)).toThrow("selectors not set for TestStrategy strategy");
  });

  it("should process a card correctly", () => {
    // Spy on the methods that process() calls
    const parsePriceSpy = vi.spyOn(strategy, "parsePrice");
    const parseQuantitySpy = vi.spyOn(strategy, "parseQuantity");
    const renderUnitPriceSpy = vi.spyOn(strategy, "renderUnitPrice");
    const logSpy = vi.spyOn(strategy, "log");

    strategy.process(mockCard);

    expect(parsePriceSpy).toHaveBeenCalledWith(mockCard);
    expect(parseQuantitySpy).toHaveBeenCalledWith(mockCard);
    expect(renderUnitPriceSpy).toHaveBeenCalledWith(mockCard, expect.any(Number), expect.any(String));
    expect(logSpy).toHaveBeenCalledTimes(4); // Called for each step of processing
  });

  it("should parse price correctly", () => {
    expect(strategy.parsePrice(mockCard)).toBe(100);

    // Test with different price
    const priceEl = mockCard.querySelector(".price")!;
    priceEl.textContent = "199.99";
    expect(strategy.parsePrice(mockCard)).toBe(199.99);
  });

  it("should parse quantity correctly", () => {
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 кг",
      multiplier: 2, // 1000 / 500
    });

    // Test with different quantities and units
    const nameEl = mockCard.querySelector(".name")!;

    nameEl.textContent = "Test Product 2кг";
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 кг",
      multiplier: 0.5, // 1 / 2
    });

    nameEl.textContent = "Test Product 750мл";
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 л",
      multiplier: 1.3333333333333333, // 1000 / 750, exact value
    });

    nameEl.textContent = "Test Product 1.5л";
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 л",
      multiplier: 0.6666666666666666, // 1 / 1.5, exact value
    });

    nameEl.textContent = "Test Product 10шт";
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 шт",
      multiplier: 0.1, // 1 / 10
    });

    // Test with no quantity in name
    nameEl.textContent = "Test Product";
    expect(strategy.parseQuantity(mockCard)).toEqual({
      unitLabel: "1 шт",
      multiplier: 1,
    });
  });

  it("should render unit price correctly", () => {
    strategy.renderUnitPrice(mockCard, 199.99, "1 кг");

    const unitPriceEl = mockCard.querySelector(".unit-price");
    expect(unitPriceEl).toBeTruthy();
    expect(unitPriceEl?.textContent).toBe("199.99 ₽ за 1 кг");
  });

  it("should log messages with strategy name prefix", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    strategy.log("test message", 123);

    expect(consoleSpy).toHaveBeenCalledWith("[TestStrategy]", "test message", 123);
  });
});
