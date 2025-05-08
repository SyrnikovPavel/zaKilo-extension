import { SamokatStrategy } from "@/strategies";
import { BaseParser } from "@/core/BaseParser";

// Автозапуск
(function (): void {
  const parser = new BaseParser(new SamokatStrategy());
  parser.init();
})();
