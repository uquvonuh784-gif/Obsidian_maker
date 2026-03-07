/**
 * Core type definitions for Obsidian Maker
 */

// ============ SCRIPT BUTTONS ============

export type ButtonColor = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type ButtonStyle = 'filled' | 'outline' | 'ghost';

export interface ButtonConfig {
    label: string;
    action: string;
    icon?: string;
    color?: ButtonColor;
    style?: ButtonStyle;

    // Action-specific parameters
    filename?: string;
    folder?: string;
    content?: string;
    template?: string;
    open?: boolean;
    path?: string;
    newTab?: boolean;
    position?: 'start' | 'end' | 'cursor';
    command?: string;
    url?: string;
    prompt?: string;
}

// ============ AI CHAT ============

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: number;
}

// ============ MODULES ============

/**
 * Интерфейс feature-модуля.
 * Каждая фича реализует этот интерфейс и регистрируется через ModuleRegistry.
 */
export interface PluginModule {
    /** Уникальный идентификатор модуля */
    id: string;
    /** Отображаемое имя */
    name: string;
    /** Вызывается при загрузке плагина */
    register(): Promise<void> | void;
    /** Вызывается при выгрузке плагина */
    unregister(): Promise<void> | void;
}
