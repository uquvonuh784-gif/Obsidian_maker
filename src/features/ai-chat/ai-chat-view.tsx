import { ItemView, WorkspaceLeaf } from 'obsidian';
import { render } from 'preact';
import { ChatApp } from './ChatApp';
import type { GroqService } from './groq-service';

export const AI_CHAT_VIEW_TYPE = 'obsidian-maker-ai-chat';

/**
 * Боковая панель AI чата.
 * Монтирует Preact-компонент ChatApp в контейнер Obsidian.
 */
export class AiChatView extends ItemView {
    private groqService: GroqService;

    constructor(leaf: WorkspaceLeaf, groqService: GroqService) {
        super(leaf);
        this.groqService = groqService;
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
            <ChatApp groqService={this.groqService} />,
            container
        );
    }

    async onClose(): Promise<void> {
        render(null, this.contentEl);
    }
}
