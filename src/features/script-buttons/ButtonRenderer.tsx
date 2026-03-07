import { h } from 'preact';
import { ButtonConfig } from '../../core/types';
import * as LucideIcons from 'lucide-preact';

interface ButtonRendererProps {
    config: ButtonConfig;
    onClick: (e: MouseEvent) => void;
    isLoading?: boolean;
}

export function ButtonRenderer({ config, onClick, isLoading }: ButtonRendererProps) {
    const { label, icon, color = 'default', style = 'filled' } = config;

    // Resolve icon
    let IconComponent = null;
    if (icon) {
        // Convert 'file-plus' or 'FilePlus' to PascalCase
        const pascalIcon = icon
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        // @ts-ignore - Dynamic access to Lucide icons
        IconComponent = LucideIcons[pascalIcon] || LucideIcons[icon];
    }

    // Determine classes
    const classNames = [
        'om-script-btn',
        `om-script-btn--color-${color}`,
        `om-script-btn--style-${style}`,
        isLoading ? 'om-script-btn--loading' : '',
    ].filter(Boolean).join(' ');

    return (
        <button class={classNames} onClick={onClick} disabled={isLoading}>
            <div class="om-script-btn__content">
                {isLoading && (
                    <LucideIcons.Loader2 class="om-script-btn__spinner" size={16} />
                )}
                {!isLoading && IconComponent && (
                    <IconComponent class="om-script-btn__icon" size={16} />
                )}
                <span class="om-script-btn__label">{label}</span>
            </div>
        </button>
    );
}
