import { App, TFile } from 'obsidian';

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
}
