import { PluginModule, ButtonConfig } from '../../core/types';
import ObsidianMaker from '../../main';
import { ActionRunner } from './action-runner';
import { ButtonRenderer } from './ButtonRenderer';
import { parseYaml, Notice } from 'obsidian';
import { h, render } from 'preact';

export class ScriptButtonsModule implements PluginModule {
    id = 'script-buttons';
    name = 'Script Buttons';

    private runner: ActionRunner;

    constructor(private plugin: ObsidianMaker) {
        this.runner = new ActionRunner(this.plugin.app);
    }

    register(): void {
        // Регистрация кастомного блока кода `om-button`
        this.plugin.registerMarkdownCodeBlockProcessor('om-button', (source, el, ctx) => {
            try {
                const config = parseYaml(source) as Partial<ButtonConfig>;

                // Валидация
                if (!config.label) {
                    el.createEl('span', { text: '[Obsidian Maker] Ошибка: параметр label обязателен', cls: 'om-error-text' });
                    return;
                }
                if (!config.action) {
                    el.createEl('span', { text: '[Obsidian Maker] Ошибка: параметр action обязателен', cls: 'om-error-text' });
                    return;
                }

                // Контейнер для Preact
                const container = el.createDiv({ cls: 'om-script-btn-container' });

                // Обработчик клика
                const handleClick = async (e: MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Показываем загрузку (если нужно)
                    render(<ButtonRenderer config={ config as ButtonConfig } onClick = { handleClick } isLoading = { true} />, container);

                    try {
                        await this.runner.execute(config as ButtonConfig, ctx.sourcePath);
                    } finally {
                        // Возвращаем в нормальное состояние
                        render(<ButtonRenderer config={ config as ButtonConfig } onClick = { handleClick } isLoading = { false} />, container);
                    }
                };

                // Начальный рендер
                render(<ButtonRenderer config={ config as ButtonConfig } onClick = { handleClick } isLoading = { false} />, container);

            } catch (e) {
                console.error('[Obsidian Maker] Button parsing error', e);
                el.createEl('span', { text: `[Obsidian Maker] YAML Error: ${(e as Error).message}`, cls: 'om-error-text' });
            }
        });
    }

    unregister(): void {
        // Очистка при выгрузке не требуется, registerMarkdownCodeBlockProcessor 
        // очищается автоматически на уровне плагина благодаря this.plugin.registerMarkdown...
    }
}
