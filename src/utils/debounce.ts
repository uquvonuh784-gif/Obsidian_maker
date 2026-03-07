/**
 * Debounce — откладывает вызов функции до тех пор,
 * пока не пройдёт `delay` мс с момента последнего вызова.
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    };
}

/**
 * Throttle — гарантирует, что функция вызывается
 * не чаще, чем раз в `limit` мс.
 */
export function throttle<T extends (...args: unknown[]) => void>(
    fn: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

/**
 * Генерация уникального ID (простой, для клиентского использования)
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
