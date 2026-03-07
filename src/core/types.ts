/**
 * Core type definitions for Obsidian Maker
 */

// ============ TASKS ============

export interface Task {
    id: string;
    title: string;
    description: string;
    done: boolean;
    tags: string[];
    column: string;         // ID колонки на канбан-доске
    createdAt: number;      // timestamp
    updatedAt: number;      // timestamp
    deadline?: number;      // timestamp (опционально)
    subtasks: SubTask[];
    reward?: number;        // очки награды
}

export interface SubTask {
    id: string;
    title: string;
    done: boolean;
}

// ============ BOARD ============

export interface BoardColumn {
    id: string;
    name: string;
    taskIds: string[];
}

export interface BoardState {
    columns: BoardColumn[];
    tasks: Record<string, Task>;
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
