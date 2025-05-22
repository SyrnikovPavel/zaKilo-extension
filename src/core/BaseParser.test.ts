import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseParser } from "./BaseParser";
import { type IStrategy, type UnitLabel } from "@/types/IStrategy";

// Mock implementation of IStrategy for testing
class MockStrategy implements IStrategy {
  strategyName = "MockStrategy";
  selectors = {
    card: ".product-card",
    price: ".price",
    name: ".name",
    unitPrice: ".unit-price",
  };

  // Spy methods to track calls
  getCardSelector = vi.fn(() => this.selectors.card);
  parsePrice = vi.fn(() => 100);
  parseQuantity = vi.fn((): UnitLabel => ({ unitLabel: "1 кг", multiplier: 1 } as UnitLabel));
  renderUnitPrice = vi.fn();
  shouldProcess = vi.fn(() => true);
  process = vi.fn();
  log = vi.fn();
}

describe("BaseParser", () => {
  let strategy: MockStrategy;
  let parser: BaseParser;
  let mockCard: HTMLElement;

  // Setup before each test
  beforeEach(() => {
    // Create a fresh strategy and parser for each test
    strategy = new MockStrategy();
    parser = new BaseParser(strategy);

    // Create a mock card element
    mockCard = document.createElement("div");
    mockCard.className = "product-card";
    mockCard.innerHTML = `
      <div class="price">100</div>
      <div class="name">Test Product</div>
    `;
    document.body.appendChild(mockCard);

    // Mock querySelectorAll to return our mock card
    vi.spyOn(document, "querySelectorAll").mockReturnValue([mockCard] as unknown as NodeListOf<Element>);

    // Mock setTimeout and setInterval
    vi.useFakeTimers();
  });

  // Cleanup after each test
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize correctly", () => {
    expect(parser).toBeDefined();
  });

  it("should call strategy.getCardSelector when selecting cards", () => {
    parser["_selectCards"]();
    expect(strategy.getCardSelector).toHaveBeenCalled();
  });

  it("should process cards that pass shouldProcess check", () => {
    parser.runAll("test");
    expect(strategy.shouldProcess).toHaveBeenCalledWith(mockCard);
    expect(strategy.process).toHaveBeenCalledWith(mockCard);
  });

  it("should not process cards that fail shouldProcess check", () => {
    strategy.shouldProcess.mockReturnValueOnce(false);
    parser.runAll("test");
    expect(strategy.shouldProcess).toHaveBeenCalledWith(mockCard);
    expect(strategy.process).not.toHaveBeenCalled();
  });

  it("should handle errors during processing", () => {
    strategy.process.mockImplementationOnce(() => {
      throw new Error("Test error");
    });

    parser.tryProcess(mockCard, "test");
    expect(strategy.log).toHaveBeenCalledWith("✗ [test] error:", "Test error");
  });

  it("should set up mutation observer", () => {
    const mockObserve = vi.fn();
    vi.spyOn(window, "MutationObserver").mockImplementationOnce(
      () => ({ observe: mockObserve, disconnect: vi.fn() }) as unknown as MutationObserver,
    );

    parser.setupMutationObserver();
    expect(mockObserve).toHaveBeenCalledWith(document.body, {
      childList: true,
      subtree: true,
    });
  });

  it("should set up scroll listener", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    parser.setupScrollListener();
    expect(addEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
  });

  it("should set up interval", () => {
    const setIntervalSpy = vi.spyOn(window, "setInterval");

    parser.setupInterval(1000);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it("should clean up resources on destroy", () => {
    const mockDisconnect = vi.fn();
    const mockMutationObserver = { disconnect: mockDisconnect } as unknown as MutationObserver;
    parser["mutationObserver"] = mockMutationObserver;

    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    parser["scrollTimeoutId"] = 123 as unknown as number;

    const clearIntervalSpy = vi.spyOn(window, "clearInterval");
    parser["intervalId"] = 456 as unknown as number;

    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    parser.destroy();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
    expect(clearIntervalSpy).toHaveBeenCalledWith(456);
    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });

  it("should handle scroll events with debounce", () => {
    parser["onScroll"]();
    expect(parser["scrollTimeoutId"]).not.toBeNull();

    const runAllSpy = vi.spyOn(parser, "runAll");
    vi.advanceTimersByTime(300);
    expect(runAllSpy).toHaveBeenCalledWith("scroll");
  });

  it("should start when document is already loaded", () => {
    const runAllSpy = vi.spyOn(parser, "runAll");
    const setupMutationObserverSpy = vi.spyOn(parser, "setupMutationObserver");
    const setupScrollListenerSpy = vi.spyOn(parser, "setupScrollListener");
    const setupIntervalSpy = vi.spyOn(parser, "setupInterval");

    parser.start();

    expect(runAllSpy).toHaveBeenCalledWith("init");
    expect(setupMutationObserverSpy).toHaveBeenCalled();
    expect(setupScrollListenerSpy).toHaveBeenCalled();
    expect(setupIntervalSpy).toHaveBeenCalledWith(5000);
  });
});
