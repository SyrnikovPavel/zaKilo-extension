class CooperProductCard {
    // Универсальный селектор для всех карточек продукта
    static CARD_SELECTOR     = 'div[class*=ProductCard_root]';
    // Акционная или обычная цена внутри блока цены
    static PRICE_NEW_SEL     = '[class*=ProductCard_price] [class*=ProductCardPrice_accent][class*=CommonProductCard_priceText], [class*=ProductCard_price] [class*=ProductCardPrice_price][class*=CommonProductCard_priceText]';
    // Вес или уже готовая unit-цена
    static VOLUME_SEL        = 'div[class*=ProductCard_volume]';
    // Наблюдаем за всем телом документа, чтобы ловить любые динамические вставки
    static OBSERVE_CONTAINER = 'body';
    // Метка unit-price
    static UNIT_PRICE_SEL    = '[data-testid="unit-price"]';

    static init() {
        CooperProductCard.log('=== ИНИЦИАЛИЗАЦИЯ CooperProductCard ===');
        CooperProductCard.runAll('init');
        CooperProductCard.watchMutations();
        CooperProductCard.setupRunAllInterval(5000);
    }

    static log(...args) {
        console.log('[cooper]', ...args);
    }

    static runAll(source) {
        const cards = Array.from(document.querySelectorAll(CooperProductCard.CARD_SELECTOR));
        CooperProductCard.log(`${source}: найдено карточек=${cards.length}`);
        cards
            .filter(el =>
                el.querySelector(CooperProductCard.PRICE_NEW_SEL) &&
                el.querySelector(CooperProductCard.VOLUME_SEL) &&
                !el.querySelector(CooperProductCard.UNIT_PRICE_SEL)
            )
            .forEach(el => CooperProductCard.tryProcess(el, source));
    }

    static tryProcess(el, source) {
        CooperProductCard.log(`tryProcess [${source}]`);
        try {
            new CooperProductCard(el).process();
            CooperProductCard.log(`✓ [${source}] успешно`);
        } catch (err) {
            CooperProductCard.log(`✗ [${source}] ошибка:`, err.message);
        }
    }

    static watchMutations() {
        const container = document.querySelector(CooperProductCard.OBSERVE_CONTAINER);
        if (!container) return CooperProductCard.log('watchMutations: контейнер не найден');
        const mo = new MutationObserver(muts => {
            muts.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (!(n instanceof HTMLElement)) return;
                    if (n.matches(CooperProductCard.CARD_SELECTOR))
                        CooperProductCard.tryProcess(n, 'watchMutations');
                    n.querySelectorAll(CooperProductCard.CARD_SELECTOR)
                        .forEach(el => CooperProductCard.tryProcess(el, 'watchMutations'));
                });
            });
        });
        mo.observe(container, { childList: true, subtree: true });
        CooperProductCard.log('watchMutations: запущен');
    }

    static setupRunAllInterval(ms) {
        setInterval(() => CooperProductCard.runAll('interval'), ms);
    }

    constructor(cardEl) {
        this.cardEl = cardEl;
    }

    process() {
        const priceEl  = this.cardEl.querySelector(CooperProductCard.PRICE_NEW_SEL);
        const volEl    = this.cardEl.querySelector(CooperProductCard.VOLUME_SEL);
        if (!priceEl || !volEl) throw new Error('Не найдены цена или объём');

        // --- Специальный кейс: в volEl уже указана цена за 1 кг ---
        const volText = volEl.textContent.trim();         // "26,99 ₽ за 1 кг"
        if (/₽\s*за\s*1\s*кг/i.test(volText)) {
            // выдираем число из текста volEl
            const match = volText.match(/([\d.,]+)\s*₽/);
            if (!match) throw new Error('Не удалось распарсить unit-цену из объёма: ' + volText);
            const unitPrice = parseFloat(match[1].replace(',', '.'));
            const unitValue = unitPrice < 20 ? Math.round(unitPrice * 100) / 100 : Math.ceil(unitPrice);
            const display = unitPrice < 20 ? unitValue.toFixed(2) : unitValue;

            const span = document.createElement('span');
            span.setAttribute('data-testid', 'unit-price');
            span.textContent = `${display} ₽ за 1 кг`;
            Object.assign(span.style, {
                display: 'inline-block',
                color: 'rgb(0, 0, 0)',
                backgroundColor: 'rgb(230, 245, 239)',
                padding: '2px 6px 2px 0px',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '18px'
            });

            const priceContainer = priceEl.closest('[class*=ProductCard_price][class*=CommonProductCard_price]');
            if (!priceContainer) throw new Error('Контейнер цены не найден');
            priceContainer.querySelectorAll(CooperProductCard.UNIT_PRICE_SEL).forEach(e => e.remove());
            priceContainer.appendChild(span);
            return;
        }
        // --- /Специальный кейс ---

        // Обычный расчёт по весу или объёму
        const priceContainer = priceEl.closest('[class*=ProductCard_price][class*=CommonProductCard_price]');
        if (!priceContainer) throw new Error('Контейнер цены не найден');

        // Получаем числовую цену из priceEl
        let rawTxt = '';
        priceEl.childNodes.forEach(n => {
            if (n.nodeType === Node.TEXT_NODE) rawTxt += n.textContent;
        });
        const price = this._parsePriceText(rawTxt);

        // Получаем total и multiplier из текста volEl
        const { name, multiplier } = this._parseQuantity(volEl.textContent);
        CooperProductCard.log('DEBUG multiplier:', multiplier, 'base price:', price);

        const rawUnit = price * multiplier;
        const unitValue = rawUnit < 20 ? Math.round(rawUnit * 100) / 100 : Math.ceil(rawUnit);
        const display = rawUnit < 20 ? unitValue.toFixed(2) : unitValue;

        priceContainer.querySelectorAll(CooperProductCard.UNIT_PRICE_SEL).forEach(e => e.remove());

        const span = document.createElement('span');
        span.setAttribute('data-testid', 'unit-price');
        span.textContent = `${display}\u2009₽ за ${name}`;
        Object.assign(span.style, {
            display: 'inline-block',
            color: 'rgb(0, 0, 0)',
            backgroundColor: 'rgb(230, 245, 239)',
            padding: '2px 6px 2px 0px',
            borderRadius: '4px',
            fontWeight: '600',
            fontSize: '18px'
        });
        priceContainer.appendChild(span);
    }

    _parsePriceText(txt) {
        const num = txt.replace(/[^\d,\.]/g, '').replace(',', '.');
        const v = parseFloat(num);
        if (isNaN(v)) throw new Error('Цена не распознана: ' + txt);
        return v;
    }

    _parseQuantity(input) {
        const s = input.toLowerCase().replace(/,/g, '.').trim();
        const mulMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)/i);
        let total, unit;
        if (mulMatch) {
            total = parseFloat(mulMatch[1]) * parseFloat(mulMatch[2]);
            unit = mulMatch[3];
        } else {
            const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
            if (!m) throw new Error('Вес не распознан: ' + input);
            total = parseFloat(m[1]);
            unit = m[2];
        }
        unit = unit.replace(/\.+$/, '');
        switch (unit) {
            case 'г': case 'гр': return { name: '1 кг', multiplier: 1000 / total };
            case 'кг':          return { name: '1 кг', multiplier: 1 / total };
            case 'мл':          return { name: '1 л',  multiplier: 1000 / total };
            case 'л':           return { name: '1 л',  multiplier: 1 / total };
            case 'шт': case 'шт.': return { name: '1 шт', multiplier: 1 / total };
            default: throw new Error('Неизвестная единица: ' + unit);
        }
    }
}

// Автозапуск
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CooperProductCard.init());
    } else {
        CooperProductCard.init();
    }
})();

