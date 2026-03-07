---
description: Deploy and test the Obsidian plugin locally
---
# Развертывание плагина в тестовый Vault

Для быстрой проверки изменений нам нужно, чтобы собранный плагин (команда `npm run dev` или `npm run build`) копировался в папку тестового Vault Obsidian.
Обычно Obsidian хранит плагины по пути `[Путь к Vault]/.obsidian/plugins/[Имя Плагина]/`.

## Шаги (Workflow):
1. **Сборка плагина**
   В корне проекта выполните команду `npm run dev`. Она запустит процесс `esbuild`, который будет пересобирать файл `main.js` при каждом сохранении `main.ts`.

2. **Копирование файлов**
   Настройте автоматическое копирование (или вручную перенесите) следующие 3 файла в папку `.obsidian/plugins/obsidian-maker/` вашего тестового Vault:
   * `main.js`
   * `manifest.json`
   * `styles.css`

3. **Перезагрузка в Obsidian**
   * Откройте Obsidian с тестовым Vault.
   * Перейдите в **Settings -> Community Plugins**.
   * Отключите 'Safe mode'.
   * Найдите свой плагин в списке 'Installed plugins' и включите его.
   * **Совет:** Назначьте горячую клавишу (например, Ctrl+R) на команду `[Community Plugins] Reload plugin: (Ваш плагин)`, чтобы перезагружать его после каждого сохранения кода, не заходя в настройки.
