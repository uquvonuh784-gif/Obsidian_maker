import { App, Notice, TFile, MarkdownView } from 'obsidian';
import { ButtonConfig } from '../../core/types';
import { GroqService } from '../ai-chat/groq-service';

export class ActionRunner {
    constructor(private app: App, private groqService?: GroqService) { }

    async execute(config: ButtonConfig, currentFilePath: string) {
        const action = config.action;
        try {
            switch (action) {
                case 'create-note':
                    await this.createNote(config);
                    break;
                case 'open-note':
                    await this.openNote(config);
                    break;
                case 'insert-template':
                    await this.insertTemplate(config);
                    break;
                case 'run-command':
                    await this.runCommand(config);
                    break;
                case 'open-url':
                    await this.openUrl(config);
                    break;
                case 'append-to-note':
                    await this.appendToNote(config);
                    break;
                case 'ai-prompt':
                    await this.aiPrompt(config);
                    break;
                default:
                    new Notice(`Неизвестное действие: ${action}`);
            }
        } catch (error) {
            console.error(`[Obsidian Maker] Action error:`, error);
            new Notice(`Ошибка: ${(error as Error).message}`, 5000);
        }
    }

    private applyVariables(text: string, currentFileTitle: string): string {
        if (!text) return '';
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');

        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const vaultName = this.app.vault.getName();

        return text
            .replace(/{{date}}/g, dateStr)
            .replace(/{{time}}/g, timeStr)
            .replace(/{{datetime}}/g, `${dateStr} ${timeStr}`)
            .replace(/{{title}}/g, currentFileTitle)
            .replace(/{{vault}}/g, vaultName);
    }

    private getActiveTitle(): string {
        const activeFile = this.app.workspace.getActiveFile();
        return activeFile ? activeFile.basename : 'Untitled';
    }

    private async createNote(config: ButtonConfig) {
        let { filename, folder, content, template, open = true } = config;
        if (!filename) throw new Error('Параметр filename обязателен для create-note');

        const activeTitle = this.getActiveTitle();

        filename = this.applyVariables(filename, activeTitle);
        if (folder) folder = this.applyVariables(folder, activeTitle);
        if (content) content = this.applyVariables(content, activeTitle);

        let path = folder ? `${folder}/${filename}.md` : `${filename}.md`;

        if (folder) {
            const folderAbstract = this.app.vault.getAbstractFileByPath(folder);
            if (!folderAbstract) {
                await this.app.vault.createFolder(folder);
            }
        }

        if (this.app.vault.getAbstractFileByPath(path)) {
            throw new Error('Заметка уже существует');
        }

        let finalContent = content || '';

        if (template) {
            const templatePath = template.endsWith('.md') ? template : `${template}.md`;
            const tFile = this.app.vault.getAbstractFileByPath(templatePath);
            if (tFile && tFile instanceof TFile) {
                const templData = await this.app.vault.read(tFile);
                finalContent = this.applyVariables(templData, activeTitle);
            } else {
                throw new Error('Шаблон не найден');
            }
        }

        const newFile = await this.app.vault.create(path, finalContent);
        new Notice('Заметка создана');

        if (open) {
            await this.app.workspace.getLeaf(false).openFile(newFile);
        }
    }

    private async openNote(config: ButtonConfig) {
        const { path: rawPath, newTab = false } = config;
        if (!rawPath) throw new Error('Параметр path обязателен для open-note');

        const path = this.applyVariables(rawPath, this.getActiveTitle());
        const fullPath = path.endsWith('.md') ? path : `${path}.md`;
        const file = this.app.vault.getAbstractFileByPath(fullPath);

        if (file && file instanceof TFile) {
            await this.app.workspace.getLeaf(newTab).openFile(file);
        } else {
            throw new Error('Заметка не найдена: ' + fullPath);
        }
    }

    private async insertTemplate(config: ButtonConfig) {
        const { template, position = 'cursor' } = config;
        if (!template) throw new Error('Параметр template обязателен для insert-template');

        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) throw new Error('Нет активной заметки для вставки шаблона');

        const templatePath = template.endsWith('.md') ? template : `${template}.md`;
        const tFile = this.app.vault.getAbstractFileByPath(templatePath);

        if (!tFile || !(tFile instanceof TFile)) {
            throw new Error('Шаблон не найден: ' + templatePath);
        }

        const activeTitle = this.getActiveTitle();
        const templateData = await this.app.vault.read(tFile);
        const contentToInsert = this.applyVariables(templateData, activeTitle);

        const editor = activeView.editor;
        if (position === 'start') {
            editor.replaceRange(contentToInsert + '\n', { line: 0, ch: 0 });
        } else if (position === 'end') {
            const lastLine = editor.lastLine();
            const lastLineLen = editor.getLine(lastLine).length;
            editor.replaceRange('\n' + contentToInsert, { line: lastLine, ch: lastLineLen });
        } else {
            editor.replaceSelection(contentToInsert);
        }
        new Notice('Шаблон вставлен');
    }

    private async appendToNote(config: ButtonConfig) {
        let { path, content, position = 'end', open = false } = config;
        if (!path || !content) throw new Error('Параметры path и content обязательны для append-to-note');

        const activeTitle = this.getActiveTitle();
        path = this.applyVariables(path, activeTitle);
        content = this.applyVariables(content, activeTitle);

        const fullPath = path.endsWith('.md') ? path : `${path}.md`;
        let file = this.app.vault.getAbstractFileByPath(fullPath);

        if (!file) {
            file = await this.app.vault.create(fullPath, content);
            new Notice('Заметка создана');
        } else if (file instanceof TFile) {
            await this.app.vault.process(file, (data) => {
                if (position === 'start') {
                    return content + '\n' + data;
                }
                return data + ((data && !data.endsWith('\n')) ? '\n' : '') + content;
            });
            new Notice('Текст добавлен');
        } else {
            throw new Error('Указанный путь не является файлом');
        }

        if (open && file instanceof TFile) {
            await this.app.workspace.getLeaf(false).openFile(file);
        }
    }

    private async runCommand(config: ButtonConfig) {
        const { command } = config;
        if (!command) throw new Error('Параметр command обязателен для run-command');

        // @ts-ignore
        const commands = this.app.commands;
        const success = commands.executeCommandById(command);
        if (!success) {
            throw new Error(`Команда не найдена: ${command}`);
        }
    }

    private async openUrl(config: ButtonConfig) {
        const { url } = config;
        if (!url) throw new Error('Параметр url обязателен для open-url');

        const parsedUrl = this.applyVariables(url, this.getActiveTitle());
        window.open(parsedUrl);
    }

    private async aiPrompt(config: ButtonConfig) {
        const { prompt, position = 'cursor' } = config;
        if (!prompt) throw new Error('Параметр prompt обязателен для ai-prompt');

        if (!this.groqService) {
            throw new Error('GroqService не инициализирован для ActionRunner');
        }

        const activeTitle = this.getActiveTitle();
        const finalPrompt = this.applyVariables(prompt, activeTitle);

        new Notice('AI думает...');

        // Отправляем запрос (GroqService сам добавит контент активной заметки в контекст, если она открыта)
        const aiResponse = await this.groqService.chat([{
            id: Date.now().toString(),
            role: 'user',
            content: finalPrompt,
            timestamp: Date.now()
        }]);

        // Пытаемся вставить ответ в активную заметку
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            const editor = activeView.editor;
            if (position === 'start') {
                editor.replaceRange(aiResponse + '\n\n', { line: 0, ch: 0 });
            } else if (position === 'end') {
                const lastLine = editor.lastLine();
                const lastLineLen = editor.getLine(lastLine).length;
                editor.replaceRange('\n\n' + aiResponse, { line: lastLine, ch: lastLineLen });
            } else {
                editor.replaceSelection(aiResponse);
            }
            new Notice('Ответ AI добавлен в заметку');
        } else {
            // Если нет активного редактора, просто показываем тост
            new Notice('Ответ AI:\n' + aiResponse, 10000);
        }
    }
}
