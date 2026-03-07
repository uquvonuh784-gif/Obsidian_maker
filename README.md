# 🧩 Obsidian Maker

**Модульный плагин-комбайн для Obsidian** — объединяет AI-ассистента, управление задачами и умные инструменты для заметок в одном плагине.

## ✨ Возможности

### 🤖 AI Чат (Groq)
- Встроенный чат-ассистент в боковой панели
- Работает через Groq API (модели LLaMA, Mixtral, Gemma)
- Настраиваемый системный промпт, температура, макс. токены
- Отвечает на том же языке, что и пользователь

### 📋 Канбан-доска задач *(в разработке)*
- Визуальная доска с колонками и карточками задач
- Drag & Drop перетаскивание между колонками
- Подзадачи, теги, дедлайны, награды

### 🔧 Умные утилиты *(планируется)*
- Расширенный редактор задач
- Текстовые инструменты

## 🏗 Архитектура

Плагин построен на **модульной архитектуре**:
- Каждая фича — отдельный модуль, реализующий интерфейс `PluginModule`
- Модули регистрируются через `ModuleRegistry` и загружаются автоматически
- UI написан на **Preact** (~3KB) — легковесная альтернатива React
- Стили используют **CSS-переменные Obsidian** — корректно работают в любой теме

```
src/
├── main.ts                     — Точка входа
├── core/
│   ├── types.ts               — Интерфейсы (Task, ChatMessage, PluginModule)
│   ├── settings.ts            — Настройки + вкладка Settings
│   └── module-registry.ts     — Реестр модулей
├── features/
│   └── ai-chat/               — AI чат модуль (Groq)
├── ui/                        — Общие Preact-компоненты
└── utils/
    └── debounce.ts            — Утилиты (debounce, throttle, generateId)
```

## 🚀 Установка для разработки

### Требования
- [Node.js](https://nodejs.org/) v16+
- [Obsidian](https://obsidian.md/)

### Шаги

1. **Клонируй репозиторий:**
   ```bash
   git clone https://github.com/uquvonuh784-gif/Obsidian_maker.git
   cd Obsidian_maker
   ```

2. **Установи зависимости:**
   ```bash
   npm install
   ```

3. **Собери плагин:**
   ```bash
   npm run build
   ```

4. **Скопируй файлы в Vault:**
   ```
   main.js, manifest.json, styles.css → [Vault]/.obsidian/plugins/obsidian-maker/
   ```

5. **Включи плагин** в Obsidian: Settings → Community plugins → Obsidian Maker

### Режим разработки

```bash
npm run dev     # Автоматическая пересборка при изменении файлов
npm run lint    # Проверка кода ESLint
```

## ⚙️ Настройка

После включения плагина, перейди в **Settings → Obsidian Maker**:

| Настройка | Описание |
|-----------|----------|
| **API key** | Ключ Groq API (получить на [console.groq.com](https://console.groq.com)) |
| **Model** | Модель AI (LLaMA 3.3 70B по умолчанию) |
| **Temperature** | Креативность ответов (0 = точно, 1 = креативно) |
| **Max tokens** | Максимум токенов в ответе |
| **System prompt** | Системная инструкция для AI |

## 📦 Ручная установка плагина

Скопируй 3 файла из корня проекта в папку плагина внутри Vault:

```
[Vault]/.obsidian/plugins/obsidian-maker/
├── main.js
├── manifest.json
└── styles.css
```

## 🛠 Технологии

- **TypeScript** — строгая типизация
- **Preact** — UI-компоненты (~3KB)
- **esbuild** — быстрая сборка
- **Obsidian API** — интеграция с приложением
- **Groq API** — AI-ассистент (через `requestUrl`)

## 👤 Автор

**Bykovskiy**

## 📄 Лицензия

MIT — см. [LICENSE](LICENSE)
