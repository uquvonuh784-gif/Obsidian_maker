import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { ChatMessage } from '../../core/types';
import type { GroqService } from './groq-service';
import { generateId } from '../../utils/debounce';

interface ChatAppProps {
    groqService: GroqService;
}

export function ChatApp({ groqService }: ChatAppProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setError(null);

        // Добавляем сообщение пользователя
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: text,
            timestamp: Date.now(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
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
            const errorText = err instanceof Error ? err.message : 'Unknown error';
            setError(errorText);
        } finally {
            setIsLoading(false);
            // Возвращаем фокус
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [input, messages, isLoading, groqService]);

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
            {/* Header */}
            <div class="om-chat-header">
                <span class="om-chat-header__title">AI Chat</span>
                <button
                    class="om-chat-header__clear"
                    onClick={clearChat}
                    title="Clear chat"
                >
                    ✕
                </button>
            </div>

            {/* Messages area */}
            <div class="om-chat-messages">
                {messages.length === 0 && (
                    <div class="om-chat-empty">
                        <div class="om-chat-empty__icon">🤖</div>
                        <div class="om-chat-empty__text">
                            Ask me anything about your notes, tasks, or ideas!
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div
                        key={msg.id}
                        class={`om-chat-bubble om-chat-bubble--${msg.role}`}
                    >
                        <div class="om-chat-bubble__content">
                            {msg.content}
                        </div>
                        <div class="om-chat-bubble__time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>
                ))}

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
                    placeholder="Type a message... (Shift+Enter for new line)"
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
                    title="Send message"
                >
                    {isLoading ? '⏳' : '➤'}
                </button>
            </div>
        </div>
    );
}
