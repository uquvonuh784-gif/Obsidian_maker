import { Notice, MarkdownView, Editor } from 'obsidian';
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
    }

    unregister(): void {
        // Команды выгружаются автоматически плагином
    }

    private addTransformCommand(id: string, name: string, aiPrompt: string) {
        this.plugin.addCommand({
            id: id,
            name: name,
            editorCallback: async (editor: Editor, view: MarkdownView) => {
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
        });
    }
}
