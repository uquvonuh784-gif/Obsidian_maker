import { Notice, MarkdownView, Editor, MenuItem } from 'obsidian';
import type ObsidianMaker from '../../main';
import type { PluginModule } from '../../core/types';
import { GroqService } from '../ai-chat/groq-service';

export class TextTransformModule implements PluginModule {
    id = 'text-transform';
    name = 'AI Text Transformations';

    private plugin: ObsidianMaker;
    private groqService: GroqService;

    constructor(plugin: ObsidianMaker) {
        this.plugin = plugin;
        this.groqService = new GroqService(plugin.settings.aiChat, plugin.app);
    }

    register(): void {
        this.addTransformCommand('ai-transform-grammar', 'AI: Исправить грамматику и стиль', 'Исправь грамматические и стилистические ошибки в этом тексте, сохранив оригинальный смысл. Верни только исправленный текст.');
        this.addTransformCommand('ai-transform-shorter', 'AI: Сделать короче', 'Сделай этот текст короче и лаконичнее, не теряя основной сути. Верни только сокращенный текст.');
        this.addTransformCommand('ai-transform-longer', 'AI: Сделать подробнее', 'Расширь этот текст, добавив деталей и пояснений, но сохранив исходный смысл. Верни только расширенный текст.');
        this.addTransformCommand('ai-transform-summarize', 'AI: Сделать саммари', 'Сделай краткое саммари (выжимку) для этого текста. Верни только саммари.');

        // Регистрация контекстного меню
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('editor-menu', (menu, editor) => {
                const selection = editor.getSelection();
                if (!selection) return;

                menu.addSeparator();

                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('AI: Исправить грамматику')
                        .setIcon('check-check')
                        .setSection('obsidian-maker-actions')
                        .onClick(() => this.runTransform(editor, 'Исправь грамматические и стилистические ошибки в этом тексте, сохранив оригинальный смысл. Верни только исправленный текст.'));
                });

                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('AI: Сделать короче')
                        .setIcon('shrink')
                        .setSection('obsidian-maker-actions')
                        .onClick(() => this.runTransform(editor, 'Сделай этот текст короче и лаконичнее, не теряя основной сути. Верни только сокращенный текст.'));
                });

                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('AI: Сделать подробнее')
                        .setIcon('expand')
                        .setSection('obsidian-maker-actions')
                        .onClick(() => this.runTransform(editor, 'Расширь этот текст, добавив деталей и пояснений, но сохранив исходный смысл. Верни только расширенный текст.'));
                });

                menu.addItem((item: MenuItem) => {
                    item
                        .setTitle('AI: Сделать саммари')
                        .setIcon('list')
                        .setSection('obsidian-maker-actions')
                        .onClick(() => this.runTransform(editor, 'Сделай краткое саммари (выжимку) для этого текста. Верни только саммари.'));
                });
            })
        );
    }

    unregister(): void {
        // Команды выгружаются автоматически плагином
    }

    private addTransformCommand(id: string, name: string, aiPrompt: string) {
        this.plugin.addCommand({
            id: id,
            name: name,
            editorCallback: (editor: Editor) => {
                this.runTransform(editor, aiPrompt);
            }
        });
    }

    private async runTransform(editor: Editor, aiPrompt: string) {
        const selection = editor.getSelection();

        if (!selection) {
            new Notice('Пожалуйста, выделите текст для трансформации');
            return;
        }

        new Notice('AI обрабатывает текст...');

        try {
            // Формируем запрос
            const prompt = `${aiPrompt}\n\nОригинальный текст:\n"${selection}"`;

            const response = await this.groqService.chat([{
                id: Date.now().toString(),
                role: 'user',
                content: prompt,
                timestamp: Date.now()
            }], {
                includeContext: false,
                systemPromptOverride: 'Ты AI-редактор текста. Твоя единственная цель — выполнить запрошенную трансформацию текста. Верни ТОЛЬКО результат трансформации, без приветствий, извинений и дополнительных комментариев. Ничего кроме изменённого текста.'
            });

            // Заменяем выделенный текст ответом
            editor.replaceSelection(response);
            new Notice('Текст успешно трансформирован!');
        } catch (error) {
            console.error('[Obsidian Maker] Text transform error', error);
            new Notice(`Ошибка трансформации: ${(error as Error).message}`, 7000);
        }
    }
}
