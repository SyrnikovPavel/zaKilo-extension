import { type IStrategy } from "@/types/IStrategy";

export class BaseParser {
  private strategy: IStrategy;
  private cards: HTMLElement[];
  private scrollTimeoutId: number | null;
  private mutationObserver: MutationObserver | null;
  private intervalId: number | null;

  constructor(strategy: IStrategy) {
    this.strategy = strategy;
    this.cards = [];
    this.scrollTimeoutId = null;
    this.mutationObserver = null;
    this.intervalId = null;
    this.onScroll = this.onScroll.bind(this);
    this.onMutation = this.onMutation.bind(this);
  }

  init(): void {
    this.strategy.log("=== BaseParser.init ===");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.start();
    }
  }

  start(): void {
    this.runAll("init");
    this.setupMutationObserver();
    this.setupScrollListener();
    this.setupInterval(5000);
  }

  private _selectCards(): void {
    const selector = this.strategy.getCardSelector();
    this.cards = Array.from(document.querySelectorAll(selector));
    this.strategy.log(`found ${this.cards.length} cards`);
  }

  runAll(source: string): void {
    this._selectCards();
    if (!this.cards.length) return;
    this.cards.filter((el) => this.strategy.shouldProcess(el)).forEach((el) => this.tryProcess(el, source));
  }

  tryProcess(el: HTMLElement, source: string): void {
    this.strategy.log(`tryProcess [${source}]`);
    try {
      this.strategy.process(el);
      this.strategy.log(`✓ [${source}] success`);
    } catch (err) {
      this.strategy.log(`✗ [${source}] error:`, err instanceof Error ? err.message : String(err));
    }
  }

  setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver(this.onMutation);
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.strategy.log("MutationObserver started");
  }

  private onMutation(mutations: MutationRecord[]): void {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches(this.strategy.getCardSelector())) {
          this.tryProcess(node, "MO");
        }
        node
          .querySelectorAll(this.strategy.getCardSelector())
          .forEach((el) => this.tryProcess(el as HTMLElement, "MO"));
      });
    });
  }

  setupScrollListener(): void {
    window.addEventListener("scroll", this.onScroll, { passive: true });
    this.strategy.log("Scroll listener started");
  }

  private onScroll(): void {
    if (this.scrollTimeoutId !== null) {
      clearTimeout(this.scrollTimeoutId);
    }
    this.scrollTimeoutId = window.setTimeout(() => this.runAll("scroll"), 300);
  }

  setupInterval(ms: number): void {
    this.intervalId = window.setInterval(() => this.runAll("interval"), ms);
    this.strategy.log(`Interval runAll every ${ms}ms`);
  }

  destroy(): void {
    if (this.mutationObserver) this.mutationObserver.disconnect();
    if (this.scrollTimeoutId !== null) clearTimeout(this.scrollTimeoutId);
    if (this.intervalId !== null) clearInterval(this.intervalId);
    window.removeEventListener("scroll", this.onScroll);
    this.strategy.log("BaseParser destroyed");
  }
}
