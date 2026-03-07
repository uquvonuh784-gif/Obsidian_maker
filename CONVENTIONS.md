# 📐 Конвенции кода (Coding Conventions)

> **Для AI:** Этот документ описывает КАК писать код в проекте.
> Следуй этим правилам при создании любого нового кода.

---

## 1. Язык и типизация

- **TypeScript** с `strict: true`
- Все типы и интерфейсы — в `src/core/types.ts`
- Избегать `any` — использовать конкретные типы или `unknown`
- Предпочитать `interface` над `type` для объектов

---

## 2. Структура файлов

### Правило модуля
Каждая фича живёт в отдельной папке `src/features/<feature-name>/`:

```
src/features/my-feature/
├── index.ts              — Barrel export (только экспорт модуля)
├── my-feature-module.ts  — Класс, реализующий PluginModule
├── my-feature-view.tsx   — Obsidian ItemView (если нужен UI)
├── MyComponent.tsx       — Preact-компоненты (PascalCase)
├── my-service.ts         — Сервис/логика (kebab-case)
└── utils.ts              — Локальные утилиты (если нужны)
```

### Именование файлов
| Тип | Формат | Пример |
|-----|--------|--------|
| Модуль (`PluginModule`) | `feature-module.ts` | `ai-chat-module.ts` |
| View (Obsidian) | `feature-view.tsx` | `ai-chat-view.tsx` |
| Preact-компонент | `PascalCase.tsx` | `ChatApp.tsx`, `TaskCard.tsx` |
| Сервис/логика | `kebab-case.ts` | `groq-service.ts`, `action-runner.ts` |
| Barrel export | `index.ts` | `index.ts` |

### main.ts — минимальный
`main.ts` содержит ТОЛЬКО:
- Загрузку настроек
- Регистрацию SettingTab
- Создание и регистрацию модулей через `ModuleRegistry`
- `loadAll()` / `unloadAll()`

Никакой бизнес-логики в `main.ts`.

---

## 3. Паттерн модуля (PluginModule)

Каждый модуль:
1. Реализует интерфейс `PluginModule` из `src/core/types.ts`
2. Имеет `id` (kebab-case) и `name` (человекочитаемое)
3. В `register()` — регистрирует Views, команды, ribbon icons
4. В `unregister()` — очищает (detach leaves, etc.)
5. Получает `plugin: ObsidianMaker` через конструктор

```typescript
export class MyModule implements PluginModule {
    id = 'my-feature';
    name = 'My Feature';
    private plugin: ObsidianMaker;

    constructor(plugin: ObsidianMaker) {
        this.plugin = plugin;
    }

    register(): void {
        // Регистрация view, команд, ribbon
    }

    unregister(): void {
        // Очистка
    }
}
```

---

## 4. Preact-компоненты

- Файлы `.tsx` (не `.ts`)
- Функциональные компоненты (не классовые)
- Props через interface (не inline)
- `import { h } from 'preact'` в каждом компоненте с JSX
- Хуки: `useState`, `useCallback`, `useRef`, `useEffect` из `preact/hooks`

```tsx
import { h } from 'preact';
import { useState } from 'preact/hooks';

interface MyProps {
    value: string;
    onChange: (val: string) => void;
}

export function MyComponent({ value, onChange }: MyProps) {
    return <div class="om-my-component">{value}</div>;
}
```

### Монтирование в Obsidian
- `ItemView` → `render(<Component />, this.contentEl)` в `onOpen()`
- `Modal` → `render(<Component />, this.contentEl)` в `onOpen()`
- Всегда `render(null, this.contentEl)` в `onClose()`

---

## 5. CSS-стили

### Файл
Все стили — в одном файле `styles.css` в корне проекта.

### Префикс
Все CSS-классы начинаются с **`om-`** (Obsidian Maker).

### BEM-нотация
```css
.om-block {}
.om-block__element {}
.om-block--modifier {}
```

Примеры:
- `.om-chat-bubble` → блок
- `.om-chat-bubble__content` → элемент
- `.om-chat-bubble--user` → модификатор

### CSS-переменные Obsidian
**ВСЕГДА** использовать CSS-переменные для:
- Цветов: `var(--text-normal)`, `var(--background-primary)`, `var(--interactive-accent)`
- Размеров: `var(--size-4-2)`, `var(--size-4-4)`
- Радиусов: `var(--radius-s)`, `var(--radius-m)`, `var(--radius-l)`
- Шрифтов: `var(--font-interface)`, `var(--font-text)`

**НИКОГДА** не хардкодить цвета (`#fff`, `rgb(...)`) — это сломает поддержку тем.

### Transitions
Стандартные анимации: `transition: ... 150ms ease` для hover-эффектов.

---

## 6. Obsidian API

### Сеть
- Только `requestUrl` из Obsidian API (НЕ `fetch`, НЕ `XMLHttpRequest`)
- Это гарантирует работу на мобильных и desktop

### Vault операции
- `app.vault.create()` / `app.vault.modify()` / `app.vault.read()`
- `app.vault.getFileByPath()` — получить файл
- `app.vault.getAbstractFileByPath()` — получить файл или папку
- `app.vault.createFolder()` — создать папку

### Workspace
- `app.workspace.getLeaf()` — получить вкладку
- `app.workspace.getLeavesOfType()` — найти существующий view
- `app.workspace.revealLeaf()` — переключиться на view

### Уведомления
- `new Notice('Текст')` — информационное уведомление (3 сек)
- `new Notice('Ошибка!', 5000)` — уведомление об ошибке (5 сек)

---

## 7. Обработка ошибок

- `try/catch` вокруг всех async-операций
- Ошибки логируются через `console.error('[Obsidian Maker] ...')`
- Пользователю показываются через `Notice`
- Никогда не глотать ошибки молча

---

## 8. Комментарии и документация

- JSDoc для классов и public-методов
- Inline-комментарии — только для неочевидных решений
- Комментарии на русском допустимы (проект на русском)
- Секции кода разделяем комментариями: `// ─── Section name ───`

---

## 9. Git-конвенции

### Формат коммитов
```
<type>: <описание на английском>
```

Типы:
- `feat:` — новая функциональность
- `fix:` — исправление бага
- `chore:` — рутина (настройки, зависимости, docs)
- `refactor:` — рефакторинг без изменения поведения
- `style:` — CSS / форматирование кода
- `docs:` — документация

### Что НЕ коммитить
- `node_modules/`
- `main.js` (build artifact)
- `.obsidian-maker/` (данные плагина в Vault)
