import { App, MarkdownView, Notice, TFile } from 'obsidian';

export class VaultService {
    constructor(private app: App) { }

    /**
     * Читает содержимое заметки по пути
     */
    async readNote(path: string): Promise<string> {
        const fullPath = path.endsWith('.md') ? path : `${path}.md`;
        const file = this.app.vault.getAbstractFileByPath(fullPath);

        if (!file || !(file instanceof TFile)) {
            throw new Error(`Заметка не найдена: ${fullPath}`);
        }

        return await this.app.vault.read(file);
    }

    /**
     * Создаёт новую заметку или перезаписывает существующую
     */
    async createOrOverwriteNote(path: string, content: string): Promise<TFile> {
        let fullPath = path.trim();
        if (!fullPath.endsWith('.md')) {
            fullPath += '.md';
        }

        // Автоматическое создание папок, если их нет
        const parts = fullPath.split('/');
        if (parts.length > 1) {
            const folderPath = parts.slice(0, -1).join('/');
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                await this.app.vault.createFolder(folderPath);
            }
        }

        const existingFile = this.app.vault.getAbstractFileByPath(fullPath);
        if (existingFile instanceof TFile) {
            await this.app.vault.modify(existingFile, content);
            return existingFile;
        } else if (!existingFile) {
            return await this.app.vault.create(fullPath, content);
        } else {
            throw new Error(`По пути ${fullPath} находится не файл`);
        }
    }

    /**
     * Дописывает текст в конец заметки
     */
    async appendToNote(path: string, content: string): Promise<void> {
        const fullPath = path.endsWith('.md') ? path : `${path}.md`;
        const file = this.app.vault.getAbstractFileByPath(fullPath);

        if (!file) {
            await this.createOrOverwriteNote(fullPath, content);
            return;
        }

        if (file instanceof TFile) {
            await this.app.vault.process(file, (data) => {
                const addNewLine = data && !data.endsWith('\n');
                return data + (addNewLine ? '\n' : '') + content;
            });
        } else {
            throw new Error(`По пути ${fullPath} находится не файл`);
        }
    }

    /**
     * Ищет заметки по названию (простой поиск)
     * Возвращает список путей
     */
    searchNotes(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        const files = this.app.vault.getMarkdownFiles();

        return files
            .filter(f => f.basename.toLowerCase().includes(lowerQuery) || f.path.toLowerCase().includes(lowerQuery))
            .map(f => f.path)
            .slice(0, 10); // Ограничиваем выдачу, чтобы не забить контекст AI
    }

    /**
     * Вставляет текст в активный редактор в конец файла (или в позицию курсора)
     */
    insertIntoActiveNote(content: string, position: 'cursor' | 'end' = 'end'): void {
        // 1. Пробуем найти активное представление (обычно работает)
        let activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        // 2. Если не нашли (фокус на боковой панели), ищем среди всех вкладок типа 'markdown'
        if (!activeView) {
            const leaves = this.app.workspace.getLeavesOfType('markdown');
            const firstLeaf = leaves[0];
            if (firstLeaf) {
                activeView = firstLeaf.view as MarkdownView;
            }
        }

        if (!activeView || !activeView.editor) {
            new Notice('Не удалось найти открытую заметку. Пожалуйста, откройте заметку, в которую хотите вставить текст.');
            return;
        }

        const editor = activeView.editor;

        try {
            if (position === 'end') {
                const lastLine = editor.lastLine();
                const lastLineLen = editor.getLine(lastLine).length;

                // Добавляем отступы, если в файле уже есть текст
                const prefix = editor.getValue().length > 0 ? '\n\n' : '';
                editor.replaceRange(prefix + content, { line: lastLine, ch: lastLineLen });

                // Прокрутка к новому тексту
                const newLastLine = editor.lastLine();
                editor.scrollIntoView({ from: { line: newLastLine, ch: 0 }, to: { line: newLastLine, ch: 0 } });
            } else {
                editor.replaceSelection(content);
            }
            new Notice('Текст вставлен');
        } catch (e) {
            console.error('[Obsidian Maker] Failed to insert text', e);
            new Notice('Ошибка при вставке в файл');
        }
    }

    /**
     * Выполняет команду Obsidian по её ID
     */
    executeCommand(id: string): void {
        // @ts-ignore - исполняем команду Obsidian
        if (this.app.commands.executeCommandById(id)) {
            new Notice(`Команда получена: ${id}`);
        } else {
            console.warn(`[Obsidian Maker] Command not found: ${id}`);
            new Notice(`Команда не найдена: ${id}. Проверьте наличие плагина.`);
        }
    }
}
