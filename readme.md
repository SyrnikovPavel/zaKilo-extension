# заКило Extension

Расширение для сравнения цены за единицу товара в каталоге популярных сервисов доставки.

> **Примечание:** Проект переведен с JavaScript на TypeScript для улучшения типобезопасности и поддержки кода.

### Установка и запуск

1. Клонировать репозиторий и установить зависимости:

   ```bash
   git clone https://github.com/ruimage/zaKilo-extension.git
   cd zaKilo-extension
   npm ci
   ```

2. Режим разработки с HMR

   Добавлен режим разработки с горячей перезагрузкой модулей (HMR). Для запуска локального сервера разработки выполните:

   - Chrome:
     ```bash
      npm run build:chrome
     ```
   - Firefox:
     ```bash
     npm run build:firefox
     ```

3. Сборка dev-пакетов:

   - Chrome:
     ```bash
     npm run build:chrome
     ```
   - Firefox:
     ```bash
     npm run build:firefox
     ```

4. Linting

Pre-commit lint-staged hooks aвтоматически запускаю линтинг на измененных файлах.

- Запустить eslint: `npm run lint`
- Запустить с автоисправлением: `npm run lint:fix`

5. Тестирование

Для тестирования используется Vitest.

Для запуска тестов:

```bash
npm test
```

Для запуска тестов с отчетом покрытия:

```bash
npm run coverage
```

Pre-commit lint-staged hooks aвтоматически запускаю тесты на измененных файлах.

6. Сборка продакшен-пакетов:

   - Chrome:
     ```bash
     npm run pack:chrome
     ```
   - Firefox:
     ```bash
     npm run pack:firefox
     ```

7. Установка в браузере:

   - **Chrome**:
     1. Открыть `chrome://extensions/`
     2. Включить «Режим разработчика»
     3. Нажать «Загрузить распакованное расширение» и указать папку `dist/chrome`
   - **Firefox**:
     1. Открыть `about:debugging#/runtime/this-firefox`
     2. Нажать «Load Temporary Add-on»
     3. Выбрать `dist/firefox/manifest.json`

### Структура проекта

- `manifests/` — шаблоны манифестов (base + per-browser)
- `src/`
  - `background/` — фоновые скрипты
  - `content/` — контент-скрипты
  - `core/` — базовые классы парсинга (BaseParser, ParserStrategy)
  - `strategies/` — реализации стратегий для сайтов
  - `types/` — TypeScript типы и интерфейсы
  - `utils/` — вспомогательные утилиты (конвертация единиц)
- `public/icons/` — иконки расширения
- `vite.config.mjs` — конфиг сборки
- `tsconfig.json` — основной конфиг TypeScript
- `tsconfig.node.json` — конфиг TypeScript для Node.js
- `dist/` — dev-сборки пакетов для установки
- `ext-dist/` — production-сборки пакетов для установки

## Инструкция для контрибьюторов

Чтобы добавить поддержку нового сайта, выполните следующие шаги:

1. **Создать файл стратегии** в `src/strategies/ИмяСайтаStrategy.ts` на основе шаблона:

   - Наследовать от `ParserStrategy`.
   - Указать `strategyName` и селекторы для элементов карточки.
   - Реализовать методы:
     - `parsePrice(cardEl: HTMLElement): number` — извлечение числового значения цены.
     - `parseQuantity(cardEl: HTMLElement): UnitLabel` — разбор объёма/количества.
     - `renderUnitPrice(cardEl: HTMLElement, unitPrice: number, unitLabel: string): void` — отображение расчёта
       единичной цены.

2. **Зарегистрировать стратегию** в `src/strategies/index.ts`:

   ```typescript
   import { ИмяСайтаStrategy } from "./ИмяСайтаStrategy";

   export {
     // ... существующие стратегии
     ИмяСайтаStrategy,
   };
   ```

3. **Создать контент-скрипт** `src/content/имясайта.ts`:

   ```typescript
   import { ИмяСайтаStrategy } from "../strategies";
   import { BaseParser } from "../core/BaseParser";

   (function boot(): void {
     const parser = new BaseParser(new ИмяСайтаStrategy());
     parser.init();
   })();
   ```

4. **Добавить правило** в `src/background/background.ts`:

   ```typescript
   const siteMap: SiteConfig[] = [
     // ... существующие правила
     {
       match: ["*://*.домен.ру/*"],
       script: "src/content/имясайта.js", // Обратите внимание: расширение .js используется для скомпилированных файлов
     },
   ];
   ```

5. **Протестировать стратегию**, убедившись, что карточки обрабатываются корректно на целевом сайте.
