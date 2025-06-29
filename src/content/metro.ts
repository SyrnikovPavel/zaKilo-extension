import { BaseParser } from "../core/BaseParser";
import { MetroStrategy } from "../strategies";

(function boot(): void {
  const parser = new BaseParser(new MetroStrategy());
  parser.init();
})();
