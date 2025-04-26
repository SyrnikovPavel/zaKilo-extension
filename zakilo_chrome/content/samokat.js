class SamokatProductCard {
    static CARD_SELECTOR      = '[class*=ProductCard_root]';
    // Выбираем либо акционную цену (последний span), либо обычную
    static PRICE_NEW_SEL      = '[class*=ProductCardActions_text] span span:last-child';
    static WEIGHT_SEL         = '[class*=ProductCard_specification] span:first-child';
    static UNIT_PRICE_SEL     = '[data-testid="unit-price"]';
    static OBSERVE_CONTAINER  = '.swiper-wrapper';
    // Контейнер для вставки цены за единицу
    static DETAILS_SEL        = '[class*=ProductCard_details]';

    static init() {
        SamokatProductCard.log('=== ИНИЦИАЛИЗАЦИЯ SamokatProductCard ===');
        SamokatProductCard.runAll('init');
        SamokatProductCard.watchMutations();
        SamokatProductCard.setupScrollListener();
        SamokatProductCard.setupRunAllInterval(5000);
    }

    static log(...args) {
        console.log('[samokat]', ...args);
    }

    static runAll(source) {
        const cards = Array.from(document.querySelectorAll(SamokatProductCard.CARD_SELECTOR));
        SamokatProductCard.log(`${source}: найдено карточек=${cards.length}`);
        cards
            .filter(el =>
                el.querySelector(SamokatProductCard.PRICE_NEW_SEL) &&
                el.querySelector(SamokatProductCard.WEIGHT_SEL) &&
                !el.querySelector(SamokatProductCard.UNIT_PRICE_SEL)
            )
            .forEach(el => SamokatProductCard.tryProcess(el, source));
    }

    static tryProcess(el, source) {
        const inst = new SamokatProductCard(el);
        SamokatProductCard.log(`tryProcess [${source}]`);
        try {
            inst.process();
            SamokatProductCard.log(`✓ [${source}] успешно`);
        } catch (err) {
            SamokatProductCard.log(`✗ [${source}] ошибка:`, err.message);
        }
    }

    static watchMutations() {
        const container = document.querySelector(SamokatProductCard.OBSERVE_CONTAINER);
        if (!container) return SamokatProductCard.log('watchMutations: контейнер не найден');
        const mo = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (node.matches(SamokatProductCard.CARD_SELECTOR))
                        SamokatProductCard.tryProcess(node, 'watchMutations');
                    node.querySelectorAll?.(SamokatProductCard.CARD_SELECTOR)
                        .forEach(el => SamokatProductCard.tryProcess(el, 'watchMutations'));
                }
            }
        });
        mo.observe(container, { childList: true, subtree: true });
        SamokatProductCard.mutationObserver = mo;
    }

    static setupScrollListener() {
        const handler = SamokatProductCard.debounce(() => SamokatProductCard.runAll('scroll'), 300);
        window.addEventListener('scroll', handler, { passive: true });
        SamokatProductCard.scrollHandler = handler;
    }

    static setupRunAllInterval(ms) {
        SamokatProductCard.runAllInterval = setInterval(() => SamokatProductCard.runAll('interval'), ms);
    }

    static debounce(fn, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), wait);
        };
    }

    constructor(cardEl) {
        this.cardEl = cardEl;
    }

    process() {
        const priceEl = this.cardEl.querySelector(SamokatProductCard.PRICE_NEW_SEL);
        const weightEl = this.cardEl.querySelector(SamokatProductCard.WEIGHT_SEL);
        const details = this.cardEl.querySelector(SamokatProductCard.DETAILS_SEL);
        if (!priceEl || !weightEl || !details) throw new Error('Не найдены необходимые элементы');

        const price = this._parsePriceText(priceEl.textContent);
        const { name, multiplier } = this._parseQuantity(weightEl.textContent.trim());
        const rawUnit = price * multiplier;
        const unitPrice = rawUnit < 20 ? Math.round(rawUnit * 100) / 100 : Math.ceil(rawUnit);
        const displayPrice = rawUnit < 20 ? unitPrice.toFixed(2) : unitPrice;

        // Удаляем старые
        details.querySelectorAll(SamokatProductCard.UNIT_PRICE_SEL).forEach(e => e.remove());

        const span = document.createElement('span');
        span.setAttribute('data-testid', 'unit-price');
        span.textContent = `${displayPrice}\u2009₽ за ${name}`;
        Object.assign(span.style, {
            display: 'inline-block',
            color: 'rgb(0, 0, 0)',
            backgroundColor: 'rgb(230, 245, 239)',
            padding: '2px 6px 2px 0px',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '15px'
        });
        details.appendChild(span);
    }

    _parsePriceText(txt) {
        const num = txt.replace(/[^\d,\.]/g, '').replace(',', '.');
        const v = parseFloat(num);
        if (isNaN(v)) throw new Error('Цена не распознана: ' + txt);
        return v;
    }

    _parseQuantity(input) {
        // Заменяем запятые на точки и удаляем лишние пробелы
        const s = input.toLowerCase().replace(/,/g, '.').trim();
        // Формат NxM (например, "6x45 г" или "6×45 г")
        const mulMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)$/i);
        let total;
        let unit;
        if (mulMatch) {
            const count = parseFloat(mulMatch[1]);
            const per = parseFloat(mulMatch[2]);
            unit = mulMatch[3];
            total = count * per;
        } else {
            // Обычный формат "число + единица"
            const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
            if (!m) throw new Error('Вес не распознан: ' + input);
            total = parseFloat(m[1]);
            unit = m[2];
        }

        switch (unit) {
            case 'г': case 'гр': return { name: '1 кг', multiplier: 1000 / total };
            case 'кг': return { name: '1 кг', multiplier: 1 / total };
            case 'мл': return { name: '1 л',  multiplier: 1000 / total };
            case 'л':  return { name: '1 л',  multiplier: 1 / total };
            case 'шт.': case 'шт': return { name: '1 шт', multiplier: 1 / total };
            default: throw new Error('Неизвестная единица: ' + unit);
        }
    }
}

// Автозапуск
(function() {
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', () => SamokatProductCard.init());
    else SamokatProductCard.init();
})();
