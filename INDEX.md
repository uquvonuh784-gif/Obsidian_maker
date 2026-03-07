# Главный справочник плагина (Project Index)

## 🎯 Назначение плагина

**Obsidian Maker** — модульный плагин-комбайн для Obsidian, объединяющий:
- 🤖 AI чат-ассистент (Gemini) для анализа заметок и планирования
- 📋 Kanban-доска задач с drag-and-drop
- ✏️ Расширенный редактор задач (fullscreen modal)
- 🔧 Умные текстовые утилиты

## 📂 Архитектура и Файловая структура (карта)

```
Obsidian_maker/
├── src/
│   ├── main.ts                  — Точка входа: загрузка настроек + ModuleRegistry
│   ├── core/
│   │   ├── types.ts             — Все интерфейсы (Task, ChatMessage, BoardColumn, PluginModule)
│   │   ├── settings.ts          — Настройки с секциями + вкладка настроек (SettingTab)
│   │   └── module-registry.ts   — Реестр модулей: load/unload lifecycle
│   ├── features/                — Feature-модули (каждый реализует PluginModule)
│   │   └── .gitkeep.ts          — (Placeholder, модули будут добавляться)
│   ├── ui/                      — Общие Preact-компоненты
│   │   └── .gitkeep.ts          — (Placeholder, компоненты будут добавляться)
│   └── utils/
│       └── debounce.ts          — debounce, throttle, generateId
├── manifest.json                — Метаданные плагина (id: obsidian-maker)
├── package.json                 — npm-конфигурация
├── tsconfig.json                — TypeScript + JSX (Preact)
├── esbuild.config.mjs           — Bundler config + JSX support
├── styles.css                   — CSS-стили (om- префикс, CSS-переменные Obsidian)
├── AI_WORKFLOW.md               — Алгоритм работы AI-ассистента
├── SESSION.md                   — Текущее состояние проекта
├── INDEX.md                     — Этот файл
├── AGENTS.md                    — Правила от разработчиков Obsidian
└── .agent/
    ├── skills/SKILL.md          — UI: Preact + CSS-переменные + Lucide
    └── workflows/deploy.md      — Сборка и деплой в тестовый Vault
```

### 📖 Когда и куда смотреть:
1. **Нужно добавить новую фичу?** → Создаём папку в `src/features/`, реализуем `PluginModule`, регистрируем в `main.ts`
2. **Нужно добавить UI компонент?** → `src/ui/`, используем `.tsx`, следуем SKILL.md
3. **Нужно добавить настройку?** → `src/core/settings.ts` — добавляем поле + UI в SettingTab
4. **Нужно добавить тип/интерфейс?** → `src/core/types.ts`
5. **Нужна утилита?** → `src/utils/`
6. **Нужно изменить логику работы AI?** → `AI_WORKFLOW.md`

## 🛠 Процессы (Workflow)
* **Сборка (watch):** `npm run dev`
* **Итоговый билд:** `npm run build`
* **Линтинг:** `npm run lint`
* **Локальное тестирование:** `/deploy` workflow — копируем в `.obsidian/plugins/obsidian-maker/`

---
> Этот документ — **живой**. Все новые модули и папки должны фиксироваться здесь.
