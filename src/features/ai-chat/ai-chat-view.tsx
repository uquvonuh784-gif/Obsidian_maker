import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render } from 'preact';
import { ChatApp } from './ChatApp';
import type { GroqService } from './groq-service';
import type { VaultService } from './vault-service';

export const AI_CHAT_VIEW_TYPE = 'obsidian-maker-ai-chat';

/**
 * Боковая панель AI чата.
 * Монтирует Preact-компонент ChatApp в контейнер Obsidian.
 */
export class AiChatView extends ItemView {
    private groqService: GroqService;
    private vaultService: VaultService;

    constructor(leaf: WorkspaceLeaf, groqService: GroqService, vaultService: VaultService) {
        super(leaf);
        this.groqService = groqService;
        this.vaultService = vaultService;
    }

    getViewType(): string {
        return AI_CHAT_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'AI chat';
    }

    getIcon(): string {
        return 'message-circle';
    }

    async onOpen(): Promise<void> {
        const container = this.contentEl;
        container.empty();
        container.addClass('om-chat-view-root');

        render(
            <ChatApp groqService={this.groqService} vaultService={this.vaultService} />,
            container
        );
    }

    async onClose(): Promise<void> {
        render(null, this.contentEl);
    }
}
