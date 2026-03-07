import { h } from 'preact';
import { AiParsedAction } from './action-parser';
import * as LucideIcons from 'lucide-preact';

interface AiActionCardProps {
    action: AiParsedAction;
    status: 'pending' | 'executing' | 'success' | 'error';
    onConfirm: () => void;
    onReject: () => void;
    errorText?: string;
}

export function AiActionCard({ action, status, onConfirm, onReject, errorText }: AiActionCardProps) {
    let title = 'Unknown Action';
    let description = '';
    let Icon = LucideIcons.HelpCircle;

    if (action.action === 'create-note') {
        title = 'Создать заметку';
        description = action.path || 'Unknown path';
        Icon = LucideIcons.FilePlus;
    } else if (action.action === 'append-to-note') {
        title = 'Дописать в заметку';
        description = action.path || 'Unknown path';
        Icon = LucideIcons.FileEdit;
    } else if (action.action === 'read-note') {
        title = 'Прочитать заметку';
        description = action.path || 'Unknown path';
        Icon = LucideIcons.BookOpen;
    } else if (action.action === 'search-notes') {
        title = 'Поиск заметок';
        description = `Поиск: "${action.query || ''}"`;
        Icon = LucideIcons.Search;
    }

    return (
        <div class="om-ai-action-card">
            <div class="om-ai-action-card__header">
                <Icon size={16} class="om-ai-action-card__icon" />
                <span class="om-ai-action-card__title">{title}</span>
            </div>

            <div class="om-ai-action-card__desc">{description}</div>

            {status === 'pending' && (
                <div class="om-ai-action-card__actions">
                    <button class="om-ai-action-card__btn om-ai-action-card__btn--confirm" onClick={onConfirm}>
                        Разрешить
                    </button>
                    <button class="om-ai-action-card__btn om-ai-action-card__btn--reject" onClick={onReject}>
                        Отклонить
                    </button>
                </div>
            )}

            {status === 'executing' && (
                <div class="om-ai-action-card__status om-ai-action-card__status--executing">
                    <LucideIcons.Loader2 size={14} class="om-spin" /> Выполнение...
                </div>
            )}

            {status === 'success' && (
                <div class="om-ai-action-card__status om-ai-action-card__status--success">
                    <LucideIcons.Check size={14} /> Выполнено
                </div>
            )}

            {status === 'error' && (
                <div class="om-ai-action-card__status om-ai-action-card__status--error">
                    <LucideIcons.AlertTriangle size={14} /> Ошибка: {errorText}
                </div>
            )}
        </div>
    );
}
