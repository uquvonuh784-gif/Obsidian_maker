/**
 * Структура найденного AI действия
 */
export interface AiParsedAction {
    action: 'create-note' | 'append-to-note' | 'read-note' | 'search-notes';
    path?: string;
    content?: string;
    query?: string;
    // Опционально: оригинальный JSON
    rawJson?: string;
}

export class AiActionParser {
    /**
     * Пытается найти JSON объект с action внутри текста.
     * Возвращает распаршенный объект, либо null, если нет команд.
     */
    static parse(text: string): AiParsedAction | null {
        if (!text) return null;

        // Ищем блоки json, обрамленные в ```json ... ``` или просто в фигурные скобки `^{ ... }$`
        // Упрощенный поиск - ищем первую открывающую { и последнюю закрывающую }
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');

        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonText = text.substring(startIdx, endIdx + 1);
            try {
                const parsed = JSON.parse(jsonText);

                // Валидация
                if (parsed && typeof parsed === 'object' && 'action' in parsed) {
                    const validActions = ['create-note', 'append-to-note', 'read-note', 'search-notes'];
                    if (validActions.includes(parsed.action)) {
                        return {
                            action: parsed.action,
                            path: parsed.path,
                            content: parsed.content,
                            query: parsed.query,
                            rawJson: jsonText
                        } as AiParsedAction;
                    }
                }
            } catch (e) {
                // Это невалидный JSON, игнорируем
                return null;
            }
        }

        return null;
    }

    /**
     * Очищает текст от найденного JSON, оставляя только текстовые комментарии AI (если они были до/после)
     */
    static stripAction(text: string, actionJson?: string): string {
        if (!text || !actionJson) return text;

        // Удаляем сам JSON
        let cleanText = text.replace(actionJson, '');
        // Удаляем Markdown блоки ```json ``` если они остались пустыми
        cleanText = cleanText.replace(/```json\s*```/ig, '');
        cleanText = cleanText.replace(/```\s*```/ig, '');

        return cleanText.trim();
    }
}
