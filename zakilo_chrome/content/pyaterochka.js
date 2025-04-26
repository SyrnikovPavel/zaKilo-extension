class ProductCard {
    static processed = new WeakSet();
    static failed = new Set();

    constructor(cardEl) {
        this.cardEl = cardEl;
        this.logPrefix = '[pyaterochka]:';
        this.priceSel = '[class*=priceContainer_priceContainerCatalog]';
        this.weightSel = '[class*=mainInformation_weight]';
    }

    static runAll() {
        const cards = document.querySelectorAll(
            '[data-qa^="product-card-"], [class*=productFilterGrid_cardContainer]'
        );
        console.log('economist:', 'стартовая инициализация, найдено карточек:', cards.length);
        cards.forEach(el => ProductCard._tryProcess(el));
    }

    static _tryProcess(el) {
        if (ProductCard.processed.has(el)) return;
        try {
            new ProductCard(el).process();
            ProductCard.processed.add(el);
            ProductCard.failed.delete(el);
        } catch (err) {
            console.error('economist:', 'не удалось обработать, добавляем в очередь повторов', el, err);
            ProductCard.failed.add(el);
        }
    }

    static watchMutations() {
        const container = document.querySelector('[class*=chakra-stack.catalogPage_container]');
        if (!container) {
            console.error('economist:', 'контейнер каталога не найден для наблюдения');
            return;
        }
        const mo = new MutationObserver(muts => {
            muts.forEach(m => {
                m.addedNodes.forEach(n => {
                    if (!(n instanceof HTMLElement)) return;
                    if (n.matches('[data-qa^="product-card-"], [class*=productFilterGrid_cardContainer]')) {
                        console.log('economist:', 'обнаружена новая карточка');
                        ProductCard._tryProcess(n);
                    }
                    n.querySelectorAll?.('[data-qa^="product-card-"], [class*=productFilterGrid_cardContainer]')
                        .forEach(el => {
                            console.log('economist:', 'обнаружена вложенная карточка');
                            ProductCard._tryProcess(el);
                        });
                });
            });
        });
        mo.observe(container, { childList: true, subtree: true });
        console.log('economist:', 'MutationObserver запущен');
    }

    static startRetryLoop(interval = 5000) {
        setInterval(() => {
            if (ProductCard.failed.size === 0) return;
            console.log(`economist: повторная попытка обработки ${ProductCard.failed.size} карточек…`);
            [...ProductCard.failed].forEach(el => ProductCard._tryProcess(el));
        }, interval);
    }

    process() {
        console.log(this.logPrefix, 'начинаем process()', this.cardEl.dataset.qa || this.cardEl.id);

        this._applyFontSizeToExistingPrice();

        const weightText = this._getWeightText();
        const { name, multiplier } = this._parseQuantity(weightText);

        const price = this._getEffectivePrice();
        console.log(this.logPrefix, 'базовая цена:', price);

        // Новая логика округления как в Самокате
        const rawUnit = price * multiplier;
        let rounded;
        if (rawUnit < 20) {
            rounded = Math.round(rawUnit * 100) / 100;
        } else {
            rounded = Math.ceil(rawUnit);
        }
        const whole = Math.floor(rounded);
        const cents = Math.round((rounded - whole) * 100);
        console.log(this.logPrefix, `цена за ${name}:`, rounded);

        this._renderNewPriceBlock(price, { whole, cents }, name);

        console.log(this.logPrefix, 'готово');
    }

    _applyFontSizeToExistingPrice() {
        const containers = this.cardEl.querySelectorAll(this.priceSel);
        containers.forEach(pc => {
            pc.querySelectorAll('p').forEach(p => {
                if ([...p.classList].some(cls => cls.startsWith('priceContainer_cent'))) {
                    p.style.fontSize = '0.7em';
                } else {
                    p.style.fontSize = '0.96em';
                }
            });
        });
    }

    _getWeightText() {
        const el = this.cardEl.querySelector(this.weightSel);
        if (!el) throw new Error('вес не найден');
        return el.textContent.trim();
    }

    _parseQuantity(input) {
        const s = input.trim().toLowerCase().replace(/,/g, '.');
        const mulMatch = s.match(/^(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*([^\s\d]+)/i);
        let total;
        let unit;
        if (mulMatch) {
            const count = parseFloat(mulMatch[1]);
            const per = parseFloat(mulMatch[2]);
            unit = mulMatch[3];
            total = count * per;
        } else {
            const m = s.match(/([\d.]+)\s*([^\s\d]+)/);
            if (!m) throw new Error(`не распознано количество: "${input}"`);
            total = parseFloat(m[1]);
            unit = m[2];
        }
        switch (unit) {
            case 'мл': return { name: '1 л', multiplier: 1000 / total };
            case 'л': return { name: '1 л', multiplier: 1 / total };
            case 'г': case 'гр': return { name: '1 кг', multiplier: 1000 / total };
            case 'кг': return { name: '1 кг', multiplier: 1 / total };
            case 'шт': case 'шт.': return { name: '1 шт', multiplier: 1 / total };
            default: throw new Error('неизвестная единица: ' + unit);
        }
    }

    _getEffectivePrice() {
        const pc = this.cardEl.querySelector(this.priceSel);
        if (!pc) throw new Error('price container не найден');
        const disc = pc.querySelector('[class*=priceContainer_discountInternalContainer]');
        const block = disc || pc.querySelector('[class*=priceContainer_totalContainer]');
        if (!block) throw new Error('блок с цифрами цены не найден');
        const ps = block.querySelectorAll('p');
        const whole = parseInt(ps[0]?.textContent, 10);
        const cents = parseInt(ps[1]?.textContent, 10);
        return whole + cents / 100;
    }

    _renderNewPriceBlock(price, unitPrice, unitName) {
        // Создаем новый блок в стиле Самоката
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'flex-start';

        const oldSpan = document.createElement('span');
        oldSpan.textContent = `${price.toFixed(2).replace(/\.00$/, '')}\u2009₽`;
        oldSpan.style.fontSize = '0.96em';
        oldSpan.style.color = 'rgb(166, 166, 166)';

        const newSpan = document.createElement('span');
        newSpan.setAttribute('data-testid', 'unit-price');
        const display = unitPrice.whole + (unitPrice.cents / 100);
        newSpan.textContent = `${display < 1 && display.toFixed(2) || display}\u2009₽ за ${unitName}`;
        newSpan.style.display = 'inline-block';
        newSpan.style.color = 'rgb(0, 0, 0)';
        newSpan.style.backgroundColor = 'rgb(230, 245, 239)';
        newSpan.style.padding = '2px 6px 2px 0px';
        newSpan.style.borderRadius = '4px';
        newSpan.style.fontWeight = '600';
        newSpan.style.fontSize = '18px';

        container.append(oldSpan, newSpan);
        const old = this.cardEl.querySelector(this.priceSel);
        old.replaceWith(container);
    }
}

// Boot
(function boot() {
    function init() {
        ProductCard.runAll();
        ProductCard.watchMutations();
        ProductCard.startRetryLoop(5000);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

