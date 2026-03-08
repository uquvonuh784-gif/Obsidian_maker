import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { ChatMessage } from '../../core/types';
import type { GroqService } from './groq-service';
import { generateId } from '../../utils/debounce';
import type { VaultService } from './vault-service';
import { AiActionParser, AiParsedAction } from './action-parser';
import { AiActionCard } from './AiActionCard';
import { ActionRunner } from '../script-buttons/action-runner';
import type { ButtonConfig } from '../../core/types';

interface ChatAppProps {
    groqService: GroqService;
    vaultService: VaultService;
}

const QUICK_ACTIONS: { label: string, prompt?: string, config?: ButtonConfig }[] = [
    {
        label: '📝 Сохр. Саммари', config: {
            label: "Сделать саммари и сохранить",
            action: "create-note",
            folder: "🧠 Contexts",
            filename: "Контекст - {{title}} ({{datetime}})",
            content: "> Это автоматически сгенерированное саммари для задачи: **{{title}}**\n\n{{ai:Сделай подробное структурированное саммари текущей заметки.}}",
            open: false
        }
    },
    {
        label: '📥 Загр. Контекст', config: {
            label: "Загрузить контекст в AI",
            action: "load-context",
            folder: "🧠 Contexts"
        }
    },
    { label: '✨ Исправить', prompt: 'Исправи грамматические и пунктуационные ошибки в тексте заметки, сохранив стиль.' },
    { label: '🏷 Теги', prompt: 'Предложи 5 релевантных хештегов для этой заметки.' },
    { label: '❓ Объяснить', prompt: 'Объясни основные идеи этой заметки простыми словами.' },
    { label: '✅ Задачи', prompt: 'Выдели из текста заметки список конкретных задач (to-do list).' },
];

export function ChatApp({ groqService, vaultService }: ChatAppProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionStatuses, setActionStatuses] = useState<Record<string, 'pending' | 'executing' | 'success' | 'error'>>({});
    const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Автоскролл к последнему сообщению
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Фокус на поле ввода при загрузке
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Слушатель для получения контекста из других частей плагина (через кнопки)
    useEffect(() => {
        const handleAddContext = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.content) {
                const sysMessage: ChatMessage = {
                    id: generateId(),
                    role: customEvent.detail.role || 'system',
                    content: customEvent.detail.content,
                    timestamp: Date.now() // generateId generates from debounce? wait, generateId uses crypto
                };
                setMessages(prev => [...prev, sysMessage]);
            }
        };

        window.addEventListener('om-add-chat-message', handleAddContext);
        return () => window.removeEventListener('om-add-chat-message', handleAddContext);
    }, []);

    const sendMessage = useCallback(async (overridePrompt?: string) => {
        const text = overridePrompt || input.trim();
        if (!text || isLoading) return;

        setError(null);

        // Если это НЕ быстрый инструмент, добавляем сообщение пользователя в чат
        if (!overridePrompt) {
            const userMessage: ChatMessage = {
                id: generateId(),
                role: 'user',
                content: text,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, userMessage]);
            setInput('');
        }

        setIsLoading(true);

        try {
            // Для быстрых инструментов берем текущую историю или пустую, если не хотим смешивать
            // Но обычно инструменты лучше работают с контекстом текущего чата
            const response = await groqService.chat(overridePrompt ? [...messages, { id: 'tmp', role: 'user', content: text, timestamp: Date.now() }] : [...messages, { id: generateId(), role: 'user', content: text, timestamp: Date.now() }]);

            if (overridePrompt) {
                // Если это быстрый инструмент — только вставляем в заметку
                vaultService.insertIntoActiveNote(response);
            } else {
                // Если это обычный чат — добавляем ответ ИИ в историю
                const aiMessage: ChatMessage = {
                    id: generateId(),
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (err) {
            const errorText = err instanceof Error ? err.message : 'Unknown error';
            setError(errorText);
        } finally {
            setIsLoading(false);
            // Возвращаем фокус
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [input, messages, isLoading, groqService, vaultService]);

    const executeAction = useCallback(async (msgId: string, action: AiParsedAction) => {
        setActionStatuses(prev => ({ ...prev, [msgId]: 'executing' }));

        try {
            let resultText = '';

            if (action.action === 'create-note' && action.path && action.content) {
                await vaultService.createOrOverwriteNote(action.path, action.content);
                resultText = `Заметка "${action.path}" успешно создана.`;
            } else if (action.action === 'append-to-note' && action.path && action.content) {
                await vaultService.appendToNote(action.path, action.content);
                resultText = `Текст успешно добавлен в заметку "${action.path}".`;
            } else if (action.action === 'read-note' && action.path) {
                const content = await vaultService.readNote(action.path);
                resultText = `[Системное сообщение] Содержимое заметки "${action.path}":\n\n${content}`;
            } else if (action.action === 'search-notes' && action.query) {
                const results = vaultService.searchNotes(action.query);
                if (results.length > 0) {
                    resultText = `[Системное сообщение] Найдены следующие заметки по запросу "${action.query}":\n- ${results.join('\n- ')}`;
                } else {
                    resultText = `[Системное сообщение] По запросу "${action.query}" ничего не найдено.`;
                }
            } else {
                throw new Error('Некорректные параметры команды');
            }

            setActionStatuses(prev => ({ ...prev, [msgId]: 'success' }));

            // Если это чтение или поиск, скармливаем результат обратно ИИ автоматически
            if (action.action === 'read-note' || action.action === 'search-notes') {
                const sysMessage: ChatMessage = {
                    id: generateId(),
                    role: 'system',
                    content: resultText,
                    timestamp: Date.now()
                };

                const newMessages = [...messages, sysMessage];
                setMessages(newMessages);
                setIsLoading(true);

                try {
                    const response = await groqService.chat(newMessages);
                    const aiMessage: ChatMessage = {
                        id: generateId(),
                        role: 'assistant',
                        content: response,
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, aiMessage]);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                } finally {
                    setIsLoading(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }
            }

        } catch (err) {
            console.error('[Obsidian Maker] Action exec error', err);
            const errStr = err instanceof Error ? err.message : 'Unknown error';
            setActionStatuses(prev => ({ ...prev, [msgId]: 'error' }));
            setActionErrors(prev => ({ ...prev, [msgId]: errStr }));
        }
    }, [messages, vaultService, groqService, inputRef]);

    const rejectAction = useCallback((msgId: string) => {
        setActionStatuses(prev => ({ ...prev, [msgId]: 'error' }));
        setActionErrors(prev => ({ ...prev, [msgId]: 'Отклонено пользователем' }));
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    }, [sendMessage]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return (
        <div class="om-chat-container">
            {/* Top Side: Quick Actions Panel */}
            <div class="om-chat-top-panel">
                <div class="om-chat-header">
                    <span class="om-chat-header__title">Quick Tools</span>
                    <div class="om-chat-header__actions">
                        <button
                            class="om-chat-header__sync"
                            onClick={() => vaultService.executeCommand('obsidian-git:pull-push')}
                            title="Sync (Obsidian Git)"
                        >
                            🔄
                        </button>
                        <button
                            class="om-chat-header__clear"
                            onClick={clearChat}
                            title="Clear history"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                <div class="om-chat-quick-actions">
                    {QUICK_ACTIONS.map(action => (
                        <button
                            key={action.label}
                            class="om-chat-quick-btn"
                            onClick={() => {
                                if (action.config) {
                                    const runner = new ActionRunner(vaultService.app, groqService);
                                    runner.execute(action.config, vaultService.app.workspace.getActiveFile()?.basename || 'Untitled');
                                } else if (action.prompt) {
                                    void sendMessage(action.prompt);
                                }
                            }}
                            disabled={isLoading}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Side: Dialogue Area */}
            <div class="om-chat-dialogue-area">
                <div class="om-chat-messages">
                    {messages.length === 0 && (
                        <div class="om-chat-empty">
                            <div class="om-chat-empty__icon">🤖</div>
                            <div class="om-chat-empty__text">
                                Ask me anything about your notes, tasks, or ideas!
                            </div>
                        </div>
                    )}

                    {messages.map(msg => {
                        let textToRender = msg.content;
                        let parsedAction = null;

                        if (msg.role === 'assistant') {
                            parsedAction = AiActionParser.parse(msg.content);
                            if (parsedAction && parsedAction.rawJson) {
                                textToRender = AiActionParser.stripAction(msg.content, parsedAction.rawJson);
                            }
                        }

                        // System сообщения
                        if (msg.role === 'system' && textToRender.startsWith('[Системное сообщение]')) {
                            return (
                                <div key={msg.id} class="om-chat-system-msg">
                                    {textToRender.length > 100 ? textToRender.substring(0, 100) + '...' : textToRender}
                                </div>
                            );
                        }

                        return (
                            <div
                                key={msg.id}
                                class={`om-chat-bubble om-chat-bubble--${msg.role}`}
                            >
                                <div class="om-chat-bubble__content">
                                    {textToRender}
                                </div>

                                {msg.role === 'assistant' && !parsedAction && (
                                    <div class="om-chat-bubble__footer-actions">
                                        <button
                                            class="om-chat-bubble__footer-btn"
                                            onClick={() => vaultService.insertIntoActiveNote(textToRender)}
                                            title="Insert into note"
                                        >
                                            📥 Вставить в заметку
                                        </button>
                                    </div>
                                )}

                                {parsedAction && (
                                    <div class="om-chat-bubble__action">
                                        <AiActionCard
                                            action={parsedAction}
                                            status={actionStatuses[msg.id] || 'pending'}
                                            errorText={actionErrors[msg.id]}
                                            onConfirm={() => void executeAction(msg.id, parsedAction as AiParsedAction)}
                                            onReject={() => rejectAction(msg.id)}
                                        />
                                    </div>
                                )}

                                <div class="om-chat-bubble__time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div class="om-chat-bubble om-chat-bubble--assistant om-chat-bubble--loading">
                            <div class="om-chat-typing">
                                <span class="om-chat-typing__dot"></span>
                                <span class="om-chat-typing__dot"></span>
                                <span class="om-chat-typing__dot"></span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div class="om-chat-error">
                            ⚠️ {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div class="om-chat-input-area">
                    <textarea
                        ref={inputRef}
                        class="om-chat-input"
                        placeholder="Type message..."
                        value={input}
                        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        class="om-chat-send-btn"
                        onClick={() => { void sendMessage(); }}
                        disabled={isLoading || !input.trim()}
                        title="Send"
                    >
                        {isLoading ? '⏳' : '➤'}
                    </button>
                </div>
            </div>
        </div>
    );
}
