import { requestUrl, App, TFile } from 'obsidian';
import type { ChatMessage } from '../../core/types';
import type { AiChatSettings } from '../../core/settings';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GroqChoice {
    message: {
        role: string;
        content: string;
    };
    finish_reason: string;
}

interface GroqResponse {
    id: string;
    choices: GroqChoice[];
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

interface GroqErrorResponse {
    error: {
        message: string;
        type: string;
        code: string;
    };
}

/**
 * Сервис для работы с Groq API.
 * Использует requestUrl из Obsidian (не fetch!), чтобы работать на мобильных.
 */
export class GroqService {
    private settings: AiChatSettings;
    private app: App;

    constructor(settings: AiChatSettings, app: App) {
        this.settings = settings;
        this.app = app;
    }

    /** Обновить ссылку на настройки (при hot-reload настроек) */
    updateSettings(settings: AiChatSettings): void {
        this.settings = settings;
    }

    /**
     * Отправить сообщение и получить ответ.
     * @param messages — вся история диалога
     * @param options — дополнительные параметры (контекст, системный промпт)
     * @returns текст ответа ассистента
     */
    async chat(messages: ChatMessage[], options?: { includeContext?: boolean, systemPromptOverride?: string }): Promise<string> {
        if (!this.settings.apiKey) {
            throw new Error('Groq API key is not set. Go to Settings → Obsidian Maker → AI Chat.');
        }

        const includeContext = options?.includeContext ?? true;
        const systemPrompt = options?.systemPromptOverride !== undefined ? options.systemPromptOverride : this.settings.systemPrompt;

        // Получаем контекст текущей заметки (если включено)
        let contextText = '';
        if (includeContext) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile instanceof TFile) {
                try {
                    const content = await this.app.vault.read(activeFile);
                    contextText = `\n\n---\n[System Info] Пользователь сейчас смотрит на заметку: "${activeFile.basename}".\nЕё содержимое:\n${content}\n---`;
                } catch (e) {
                    console.error('[Obsidian Maker] Failed to read active file for context', e);
                }
            }
        }

        // Формируем массив сообщений для API
        const groqMessages: GroqMessage[] = [];

        // System prompt
        if (systemPrompt) {
            groqMessages.push({
                role: 'system',
                content: systemPrompt,
            });
        }

        // Преобразуем ChatMessage → GroqMessage
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            if (!msg) continue;

            if (msg.role === 'user' || msg.role === 'assistant') {
                let content = msg.content;

                // Добавляем контекст только к самому последнему сообщению пользователя
                if (i === messages.length - 1 && msg.role === 'user' && contextText) {
                    content += contextText;
                }

                groqMessages.push({
                    role: msg.role,
                    content: content,
                });
            }
        }

        try {
            const response = await requestUrl({
                url: GROQ_API_URL,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.settings.model,
                    messages: groqMessages,
                    max_tokens: this.settings.maxTokens,
                    temperature: this.settings.temperature,
                }),
            });

            const data = response.json as GroqResponse;

            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from AI model.');
            }

            const choice = data.choices[0];
            if (!choice) {
                throw new Error('Empty response from AI model.');
            }

            return choice.message.content;
        } catch (err: unknown) {
            // Пробуем извлечь сообщение об ошибке от Groq
            if (err && typeof err === 'object' && 'response' in err) {
                const errObj = err as { response?: string };
                try {
                    const parsed = JSON.parse(errObj.response ?? '') as GroqErrorResponse;
                    throw new Error(`Groq API error: ${parsed.error.message}`);
                } catch {
                    // Если не удалось распарсить, пробрасываем оригинальную
                }
            }

            if (err instanceof Error) {
                throw err;
            }

            throw new Error('Unknown error while calling Groq API.');
        }
    }
}
