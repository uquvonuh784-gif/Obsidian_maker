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
                    const rawContent = await this.app.vault.read(activeFile);
                    // Очищаем контекст от системных блоков и лишнего мусора
                    const cleanedContent = this.cleanNoteContent(rawContent);
                    contextText = `[КОНТЕКСТ ЗАМЕТКИ "${activeFile.basename}"]:\n${cleanedContent}\n[КОНЕЦ КОНТЕКСТА]\n\n`;
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

                // Добавляем контекст ПЕРЕД последним сообщением пользователя для лучшего фокуса
                if (i === messages.length - 1 && msg.role === 'user' && contextText) {
                    content = contextText + "ИНСТРУКЦИЯ: " + content;
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

    /** Очистить текст заметки от кнопок и системного мусора перед отправкой в AI */
    private cleanNoteContent(content: string): string {
        if (!content) return '';

        let cleaned = content;

        // 1. Удаляем блоки кнопок om-button
        cleaned = cleaned.replace(/```om-button[\s\S]*?```/g, '');

        // 2. Удаляем системные подписи и эхо (чтобы AI не зацикливался на них)
        const junkPhrases = [
            /Я полезный ИИ-ассистент, встроенный в текстовый редактор Markdown[\s\S]*?без объяснений\.?/gi,
            /Ты полезный ИИ-ассистент, встроенный в текстовый редактор Markdown[\s\S]*?без объяснений\.?/gi,
            /Данный текст представляет собой описание роли и поведения полезного ИИ-ассистента\.?/gi,
            /Нет текста заметки\. Чтобы придумать хештеги[\s\S]*?предоставьте текст заметки\.?/gi,
            /Нет текста для прочтения\. Пожалуйста, предоставьте текст заметки\.?/gi
        ];

        for (const phrase of junkPhrases) {
            cleaned = cleaned.replace(phrase, '');
        }

        // 3. Убираем лишние пустые строки
        cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();

        return cleaned || '[Текст заметки пуст]';
    }
}
