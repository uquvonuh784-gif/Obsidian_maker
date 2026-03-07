import type ObsidianMaker from '../../main';
import type { PluginModule } from '../../core/types';
import { GroqService } from './groq-service';
import { AiChatView, AI_CHAT_VIEW_TYPE } from './ai-chat-view';

/**
 * Модуль AI Чата.
 * Регистрирует боковую панель, команды и сервис Groq API.
 */
export class AiChatModule implements PluginModule {
    id = 'ai-chat';
    name = 'AI Chat';

    private plugin: ObsidianMaker;
    private groqService: GroqService;

    constructor(plugin: ObsidianMaker) {
        this.plugin = plugin;
        this.groqService = new GroqService(plugin.settings.aiChat);
    }

    register(): void {
        const plugin = this.plugin;
        const groqService = this.groqService;

        // Регистрируем кастомный View
        plugin.registerView(
            AI_CHAT_VIEW_TYPE,
            (leaf) => new AiChatView(leaf, groqService)
        );

        // Команда: открыть AI чат
        plugin.addCommand({
            id: 'open-ai-chat',
            name: 'Open AI chat',
            callback: () => { void this.activateView(); },
        });

        // Иконка в левой панели (ribbon)
        plugin.addRibbonIcon('message-circle', 'Open AI chat', () => {
            void this.activateView();
        });
    }

    unregister(): void {
        // Закрываем все экземпляры вью
        this.plugin.app.workspace.detachLeavesOfType(AI_CHAT_VIEW_TYPE);
    }

    /** Открыть (или переключиться на) панель AI чата */
    private async activateView(): Promise<void> {
        const workspace = this.plugin.app.workspace;

        // Проверяем, есть ли уже открытый чат
        const existing = workspace.getLeavesOfType(AI_CHAT_VIEW_TYPE);
        if (existing.length > 0) {
            // Фокусируемся на существующем
            const leaf = existing[0];
            if (leaf) {
                await workspace.revealLeaf(leaf);
            }
            return;
        }

        // Открываем в правой панели
        const leaf = workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({
                type: AI_CHAT_VIEW_TYPE,
                active: true,
            });
            await workspace.revealLeaf(leaf);
        }
    }
}
