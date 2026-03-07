import { requestUrl } from 'obsidian';
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

    constructor(settings: AiChatSettings) {
        this.settings = settings;
    }

    /** Обновить ссылку на настройки (при hot-reload настроек) */
    updateSettings(settings: AiChatSettings): void {
        this.settings = settings;
    }

    /**
     * Отправить сообщение и получить ответ.
     * @param messages — вся история диалога
     * @returns текст ответа ассистента
     */
    async chat(messages: ChatMessage[]): Promise<string> {
        if (!this.settings.apiKey) {
            throw new Error('Groq API key is not set. Go to Settings → Obsidian Maker → AI Chat.');
        }

        // Формируем массив сообщений для API
        const groqMessages: GroqMessage[] = [];

        // System prompt
        if (this.settings.systemPrompt) {
            groqMessages.push({
                role: 'system',
                content: this.settings.systemPrompt,
            });
        }

        // Преобразуем ChatMessage → GroqMessage
        for (const msg of messages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
                groqMessages.push({
                    role: msg.role,
                    content: msg.content,
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
