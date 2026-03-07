---
name: Obsidian API Guide
description: Справочник по основным API Obsidian: Vault (создание, чтение, изменение файлов), Workspace (вкладки, открытие) и MarkdownCodeBlockProcessor (кастомные блоки).
---

# 📚 Obsidian API: Справочник разработчика

> В этом документе собраны ключевые возможности Obsidian API, необходимые для нашего проекта (кнопки-скрипты, AI работа с заметками).

## 1. Vault (Работа с файловой системой)

`app.vault` управляет чтением, записью и поиском файлов.

### 📝 Создание файла
```typescript
/**
 * Создает новую заметку.
 * @param path Путь с именем файла (например: 'Folder/Note.md')
 * @param data Содержимое файла (опционально)
 */
const file = await app.vault.create('Folder/Note.md', '# Привет мир');
```
*Важно: Если файл уже существует, `create()` выбросит ошибку.*

### 📂 Создание папки
```typescript
// Проверяем, существует ли папка
const folderOrFile = app.vault.getAbstractFileByPath('Folder');
if (!folderOrFile) {
    await app.vault.createFolder('Folder');
}
```

### 📖 Чтение файла
```typescript
import { TFile } from 'obsidian';

// Получаем объект файла
const file = app.vault.getAbstractFileByPath('Note.md');

// Убеждаемся, что это именно TFile (а не папка TFolder)
if (file instanceof TFile) {
    const content = await app.vault.read(file);
    console.log(content);
}
```

### ✍️ Изменение файла (перезапись и добавление)
```typescript
// Перезаписать файл полностью:
await app.vault.modify(file, 'Новый текст');

// Дописать текст в начало или конец (безопаснее, чем читать и модифицировать):
await app.vault.process(file, (data) => {
    return data + '\nНовая строка в конце';
});
```

---

## 2. Workspace (Управление UI и вкладками)

`app.workspace` управляет листьями (вкладками), активными редакторами и раскладками.

### 🔍 Получение текущей активной заметки
```typescript
import { MarkdownView } from 'obsidian';

const activeView = app.workspace.getActiveViewOfType(MarkdownView);
if (activeView) {
    console.log('Текущий открытый файл:', activeView.file?.path);
    
    // Получение редактора для вставки текста под курсор
    const editor = activeView.editor;
    editor.replaceSelection('Вставленный текст');
}
```

### 🔓 Открытие заметки (TFile)
```typescript
// Открыть файл в текущей активной вкладке
await app.workspace.getLeaf(false).openFile(file);

// Открыть файл в новой вкладке
await app.workspace.getLeaf(true).openFile(file);
```

---

## 3. Команды (Commands)

Оба вызова: встроенные команды Obsidian и команды нашего плагина.

### 🚀 Запуск команды по ID
```typescript
// Выполнит команду. Вернёт false если команда не найдена.
app.commands.executeCommandById('app:open-settings');
```

---

## 4. MarkdownCodeBlock (Парсинг кастомных блоков)

Obsidian позволяет плагинам рендерить кастомные блоки кода. Это наша ключевая механика для "Кнопок-скриптов" (```om-button ... ```).

### 🛠 Регистрация процессора
Вызывается в `register()` вашего `PluginModule` (или `onload` плагина).

```typescript
plugin.registerMarkdownCodeBlockProcessor('om-button', (source, el, ctx) => {
    // 1. source — это строка с текстом внутри code block
    // 2. el — пустой HTML-элемент (div), в который мы должны отрендерить UI
    // 3. ctx — контекст (например, путь к файлу где этот блок находится)

    // Парсим YAML из source (в Obsidian есть встроенный парсер)
    import { parseYaml } from 'obsidian';
    
    try {
        const config = parseYaml(source);
        
        // Рендерим Preact компонент в el
        import { render, h } from 'preact';
        render(<MyButtonConfig config={config} />, el);
        
    } catch (e) {
        // Если YAML невалиден
        el.setText('Ошибка: невалидный YAML');
    }
});
```
*Важно: Obsidian вызывает процессор асинхронно для каждого видимого блока при скролле.*

---

## 5. Уведомления (Notices)

Удобный способ давать обратную связь.

```typescript
import { Notice } from 'obsidian';

// Обычное уведомление (живет пару секунд)
new Notice('Заметка успешно создана');

// Ошибка (показываем дольше - 5000мс)
new Notice('Ошибка: файл не найден', 5000);
```

---

## 6. YAML Парсинг и Переменные

Так как мы используем YAML для настроек кнопок, нам нужно парсить переменные вроде `{{date}}`.

```typescript
// Встроенный парсер Obsidian (очень быстрый)
import { parseYaml } from 'obsidian';

const source = "label: My Button\naction: create-note";
const data = parseYaml(source); // Вернет объект { label: "My Button", action: "create-note" }

// Пример замены переменных (для {{date}}, {{title}})
function applyVariables(text: string, currentFileTitle: string): string {
    const now = new Date();
    return text
        .replace(/{{date}}/g, now.toISOString().split('T')[0])
        .replace(/{{time}}/g, now.toTimeString().slice(0, 5))
        .replace(/{{title}}/g, currentFileTitle);
}
```

---

> Обращайся к этому файлу при реализации Физы 3 (парсинг code block, создание/модификация файлов, выполнение команд).
