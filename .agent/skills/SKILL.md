---
name: Obsidian Plugin UI Development
description: How to build beautiful UI components in our Obsidian plugin using Preact and Obsidian CSS variables
---

# Построение UI в плагине Obsidian Maker

## Обзор

Мы используем **Preact** (легковесный React, ~3KB) для создания сложных интерактивных интерфейсов: чат, канбан-доска, модальные окна с формами. Для стилизации мы используем **CSS-переменные Obsidian**, чтобы плагин автоматически вписывался в любую тему (светлую, тёмную, кастомную).

---

## 1. Настройка Preact + JSX

### Установка
```bash
npm install preact
```

### tsconfig.json — добавить JSX-поддержку
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

### esbuild.config.mjs — добавить JSX-обработку
```js
// В объект конфигурации esbuild.context({...}) добавить:
jsx: 'automatic',
jsxImportSource: 'preact',
```

### Расширения файлов
- Компоненты с JSX должны иметь расширение `.tsx` (не `.ts`).
- Обычные модули без JSX остаются `.ts`.

---

## 2. Создание компонента (Preact)

### Пример: Кнопка
```tsx
// src/ui/components/Button.tsx
import { h } from 'preact';

interface ButtonProps {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

export function Button({ label, icon, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      class={`om-button om-button--${variant}`}
      onClick={onClick}
    >
      {icon && <span class="om-button__icon">{icon}</span>}
      <span class="om-button__label">{label}</span>
    </button>
  );
}
```

### Пример: Карточка задачи
```tsx
// src/ui/components/TaskCard.tsx
import { h } from 'preact';

interface TaskCardProps {
  title: string;
  done: boolean;
  tags: string[];
  onToggle: () => void;
  onClick: () => void;
}

export function TaskCard({ title, done, tags, onToggle, onClick }: TaskCardProps) {
  return (
    <div class={`om-task-card ${done ? 'om-task-card--done' : ''}`} onClick={onClick}>
      <input
        type="checkbox"
        checked={done}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        class="om-task-card__checkbox"
      />
      <span class="om-task-card__title">{title}</span>
      <div class="om-task-card__tags">
        {tags.map(tag => <span class="om-tag">{tag}</span>)}
      </div>
    </div>
  );
}
```

---

## 3. Монтирование Preact в Obsidian View

Компоненты Preact нужно монтировать в DOM-контейнер, который предоставляет Obsidian (`ItemView.contentEl` или `Modal.contentEl`).

### Пример: Боковая панель (ItemView)
```tsx
// src/features/ai-chat/ai-chat-view.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render, h } from 'preact';
import { ChatApp } from './ChatApp';

export const AI_CHAT_VIEW_TYPE = 'obsidian-maker-ai-chat';

export class AiChatView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() { return AI_CHAT_VIEW_TYPE; }
  getDisplayText() { return 'AI Chat'; }
  getIcon() { return 'message-circle'; }

  async onOpen() {
    // Монтируем Preact-компонент в контейнер Obsidian
    render(<ChatApp />, this.contentEl);
  }

  async onClose() {
    // Размонтируем (очищаем)
    render(null, this.contentEl);
  }
}
```

### Пример: Модальное окно
```tsx
// src/features/task-editor/task-modal.ts
import { App, Modal } from 'obsidian';
import { render, h } from 'preact';
import { TaskEditorForm } from './TaskEditorForm';

export class TaskEditorModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    this.modalEl.addClass('om-modal--fullscreen');
    render(<TaskEditorForm onClose={() => this.close()} />, this.contentEl);
  }

  onClose() {
    render(null, this.contentEl);
  }
}
```

---

## 4. CSS-стилизация — Переменные Obsidian

### ПРАВИЛО: Всегда используй CSS-переменные Obsidian для цветов!
Это гарантирует, что наш плагин будет выглядеть отлично в ЛЮБОЙ теме (светлой, тёмной, кастомной).

### Ключевые переменные для использования:

#### Цвета фона
```css
var(--background-primary)      /* Основной фон */
var(--background-secondary)    /* Боковые панели */
var(--background-modifier-hover)  /* Состояние hover */
var(--background-modifier-active-hover) /* Активный hover */
var(--background-modifier-form-field) /* Поля ввода */
```

#### Цвета текста
```css
var(--text-normal)      /* Обычный текст */
var(--text-muted)       /* Приглушённый текст */
var(--text-faint)       /* Очень бледный текст */
var(--text-accent)      /* Акцентный цвет (ссылки) */
var(--text-on-accent)   /* Текст поверх акцентного фона */
```

#### Интерактивные элементы
```css
var(--interactive-accent)       /* Основной акцент (кнопки, чекбоксы) */
var(--interactive-accent-hover) /* Hover на акцентных элементах */
var(--interactive-normal)       /* Обычные интерактивные элементы */
var(--interactive-hover)        /* Hover обычных элементов */
```

#### Границы и разделители
```css
var(--background-modifier-border)       /* Границы */
var(--background-modifier-border-hover) /* Границы при hover */
```

#### Размеры (Grid system — шаг 4px)
```css
var(--size-4-1)   /* 4px  */
var(--size-4-2)   /* 8px  */
var(--size-4-3)   /* 12px */
var(--size-4-4)   /* 16px */
var(--size-4-6)   /* 24px */
var(--size-4-8)   /* 32px */
var(--size-4-12)  /* 48px */
```

#### Шрифты
```css
var(--font-interface)     /* Шрифт интерфейса */
var(--font-text)          /* Шрифт основного текста */
var(--font-monospace)     /* Моноширинный */
```

#### Радиусы скругления
```css
var(--radius-s)   /* Маленький */
var(--radius-m)   /* Средний */
var(--radius-l)   /* Большой */
```

### Пример: styles.css для нашего плагина
```css
/* ===== КНОПКИ ===== */
.om-button {
  display: inline-flex;
  align-items: center;
  gap: var(--size-4-2);
  padding: var(--size-4-2) var(--size-4-4);
  border: none;
  border-radius: var(--radius-m);
  font-family: var(--font-interface);
  font-size: var(--font-ui-small);
  cursor: pointer;
  transition: background-color 150ms ease, transform 100ms ease;
}

.om-button:active {
  transform: scale(0.97);
}

.om-button--primary {
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
}

.om-button--primary:hover {
  background-color: var(--interactive-accent-hover);
}

.om-button--secondary {
  background-color: var(--interactive-normal);
  color: var(--text-normal);
}

.om-button--secondary:hover {
  background-color: var(--interactive-hover);
}

.om-button--danger {
  background-color: var(--background-modifier-error);
  color: var(--text-on-accent);
}

/* ===== КАРТОЧКА ЗАДАЧИ ===== */
.om-task-card {
  display: flex;
  align-items: center;
  gap: var(--size-4-3);
  padding: var(--size-4-3) var(--size-4-4);
  background-color: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  cursor: pointer;
  transition: box-shadow 150ms ease, border-color 150ms ease;
}

.om-task-card:hover {
  border-color: var(--background-modifier-border-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.om-task-card--done .om-task-card__title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* ===== ТЕГИ ===== */
.om-tag {
  display: inline-block;
  padding: 2px var(--size-4-2);
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
  border-radius: var(--radius-s);
  font-size: var(--font-ui-smaller);
  font-weight: 500;
}

/* ===== ПОЛНОЭКРАННАЯ МОДАЛКА ===== */
.om-modal--fullscreen {
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
}

/* ===== ЧАТ ===== */
.om-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.om-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--size-4-4);
}

.om-chat-input-area {
  display: flex;
  gap: var(--size-4-2);
  padding: var(--size-4-3);
  border-top: 1px solid var(--background-modifier-border);
}

.om-chat-input {
  flex: 1;
  padding: var(--size-4-2) var(--size-4-3);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  background-color: var(--background-modifier-form-field);
  color: var(--text-normal);
  font-family: var(--font-interface);
  resize: none;
}

.om-chat-input:focus {
  border-color: var(--interactive-accent);
  outline: none;
}

.om-chat-bubble {
  padding: var(--size-4-3) var(--size-4-4);
  border-radius: var(--radius-l);
  margin-bottom: var(--size-4-2);
  max-width: 85%;
  animation: om-fade-in 200ms ease;
}

.om-chat-bubble--user {
  background-color: var(--interactive-accent);
  color: var(--text-on-accent);
  margin-left: auto;
}

.om-chat-bubble--ai {
  background-color: var(--background-secondary);
  color: var(--text-normal);
  margin-right: auto;
}

/* ===== АНИМАЦИИ ===== */
@keyframes om-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 5. Иконки

Obsidian использует библиотеку **Lucide Icons**. Для встроенных элементов (`addRibbonIcon`, `getIcon` в ItemView) можно указывать имя иконки строкой:
- `message-circle` — чат
- `kanban` — канбан
- `check-square` — задачи
- `settings` — настройки
- `plus` — добавить
- `trash-2` — удалить
- `edit` — редактировать
- `send` — отправить

Полный список: https://lucide.dev/icons/

Для использования иконок внутри Preact-компонентов можно использовать хелпер Obsidian:
```ts
import { setIcon } from 'obsidian';

// Внутри компонента после render:
const el = document.querySelector('.my-icon-container');
if (el) setIcon(el as HTMLElement, 'message-circle');
```

---

## 6. Префикс CSS-классов

**ПРАВИЛО:** Все наши CSS-классы начинаются с префикса `om-` (Obsidian Maker), чтобы не конфликтовать с классами самого Obsidian или других плагинов.

Примеры:
- `om-button`, `om-button--primary`
- `om-task-card`, `om-task-card--done`
- `om-chat-bubble`, `om-chat-bubble--user`
- `om-modal--fullscreen`

---

## 7. Когда использовать этот скилл

Обращайся к этому документу когда:
- Создаёшь новый визуальный компонент (кнопку, карточку, панель, модалку).
- Добавляешь стили — ВСЕГДА проверяй, есть ли на это CSS-переменная Obsidian.
- Монтируешь Preact-компонент в Obsidian View или Modal.
- Не помнишь какой Lucide Icon использовать.
