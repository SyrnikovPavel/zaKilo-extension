# GitHub Actions Troubleshooting Guide

Руководство по устранению проблем с CI/CD процессом zaKilo Extension.

## 🔍 Общие проблемы и решения

### 1. PR Checks не запускаются

**Проблема:** Workflow не срабатывает при создании Pull Request.

**Возможные причины:**

- PR создан в той же ветке (нужно создавать из форка или feature ветки)
- Изменения только в исключенных файлах (`.md`, `docs/`, `screenshots/`)
- Проблемы с правами доступа к репозиторию

**Решение:**

```bash
# Проверить, что PR создан из правильной ветки
git checkout -b feature/my-feature
git push origin feature/my-feature
# Затем создать PR из feature/my-feature в main
```

### 2. Ошибки установки зависимостей

**Проблема:** `npm ci` завершается с ошибкой.

**Типичные ошибки:**

```
Error: Cannot find module 'some-package'
ENOENT: no such file or directory, open 'package-lock.json'
```

**Решение:**

1. Убедиться, что `package-lock.json` закоммичен в репозиторий
2. Проверить совместимость Node.js версий:
   ```json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

### 3. TypeScript ошибки

**Проблема:** `npm run type-check` завершается с ошибками.

**Частые ошибки:**

```
error TS2307: Cannot find module '@/some-module'
error TS2304: Cannot find name 'chrome'
```

**Решение:**

```bash
# Локальная проверка перед пушем
npm run type-check
npm run lint
npm run test:ci
```

### 4. Ошибки сборки расширения

**Проблема:** Build завершается с ошибкой, но локально работает.

**Проверки:**

```bash
# Локальная проверка сборки
npm run build:chrome
npm run build:firefox
npm run pack:chrome
npm run pack:firefox
```

**Часто помогает:**

- Удаление `node_modules` и переустановка: `rm -rf node_modules && npm ci`
- Проверка версий в `package.json`

### 5. Проблемы с релизами

**Проблема:** Релиз не создается или файлы не прикрепляются.

**Возможные причины:**

- Недостаточно прав у `GITHUB_TOKEN`
- Тег уже существует
- Ошибка в именах файлов

**Проверка:**

```bash
# Проверить текущую версию
node -p "require('./package.json').version"

# Проверить существующие теги
git tag -l
```

### 6. Timeout ошибки

**Проблема:** Workflow завершается по timeout.

**Настройки timeout:**

- PR Checks: 15 минут (тесты), 10 минут (сборка)
- Build and Release: 15 минут

**Решение:**

- Оптимизировать тесты
- Проверить performance зависимостей
- При необходимости увеличить timeout в workflow

## 🛠️ Диагностические команды

### Локальная проверка перед коммитом

```bash
# Полная проверка как в CI
npm ci
npm run type-check
npm run lint
npm run test:ci
npm run build:chrome
npm run build:firefox
```

### Проверка артефактов

```bash
# После сборки проверить созданные файлы
ls -la ext-dist/
file ext-dist/*.zip
```

### Проверка манифестов

```bash
# Валидация манифеста для Chrome
cd dist/chrome && cat manifest.json | jq .

# Валидация манифеста для Firefox
cd dist/firefox && cat manifest.json | jq .
```

## 📋 Чек-лист перед созданием PR

- [ ] Код проходит `npm run lint`
- [ ] Тесты проходят `npm run test:ci`
- [ ] TypeScript компилируется `npm run type-check`
- [ ] Сборка успешна для обеих платформ
- [ ] Изменения протестированы локально
- [ ] Описание PR содержит суть изменений

## 🚨 Экстренное восстановление

### Откат проблемного релиза

```bash
# Удалить тег локально и на сервере
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# Удалить релиз через GitHub UI или API
```

### Принудительный перезапуск workflow

```bash
# Пустой коммит для перезапуска CI
git commit --allow-empty -m "ci: force restart workflow"
git push
```

## 📞 Получение помощи

1. **Логи GitHub Actions:** Проверить детальные логи в разделе Actions
2. **Локальное воспроизведение:** Повторить проблему локально
3. **Issue tracker:** Создать issue с описанием проблемы и логами
4. **Документация GitHub Actions:** [Официальная документация](https://docs.github.com/en/actions)

## 🔧 Настройка для разработчиков

### Локальная имитация CI окружения

Используйте [act](https://github.com/nektos/act) для локального запуска GitHub Actions:

```bash
# Установка act
brew install act  # macOS
# или
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Запуск PR checks локально
act pull_request

# Запуск build workflow локально
act push
```

### Отладка workflow

1. Добавить отладочные шаги:

```yaml
- name: Debug info
  run: |
    echo "Node version: $(node -v)"
    echo "NPM version: $(npm -v)"
    echo "Working directory: $(pwd)"
    ls -la
```

2. Использовать
   [debug режим](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging):

```
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```
