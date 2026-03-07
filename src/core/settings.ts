import { App, PluginSettingTab, Setting } from 'obsidian';
import type ObsidianMaker from '../main';

// ============ INTERFACES ============

/** Настройки AI чата (Groq API) */
export interface AiChatSettings {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
}

/** Настройки канбан-доски */
export interface TaskBoardSettings {
    defaultColumns: string[];
}

/** Глобальные настройки плагина */
export interface ObsidianMakerSettings {
    aiChat: AiChatSettings;
    taskBoard: TaskBoardSettings;
}

// ============ DEFAULTS ============

export const DEFAULT_SETTINGS: ObsidianMakerSettings = {
    aiChat: {
        apiKey: '',
        model: 'llama-3.3-70b-versatile',
        maxTokens: 4096,
        temperature: 0.7,
        systemPrompt: 'You are a helpful AI assistant integrated into Obsidian note-taking app. You help users with their notes, tasks, planning and creative work. Be concise and practical. Respond in the same language the user writes to you.',
    },
    taskBoard: {
        defaultColumns: ['To Do', 'In Progress', 'Done'],
    },
};

// ============ AVAILABLE MODELS ============

export const GROQ_MODELS = [
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B (versatile)' },
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B (fast)' },
    { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B (versatile)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (32K context)' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
];

// ============ SETTINGS TAB ============

export class ObsidianMakerSettingTab extends PluginSettingTab {
    plugin: ObsidianMaker;

    constructor(app: App, plugin: ObsidianMaker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // ─── AI Chat ───
        new Setting(containerEl).setName('AI Chat (Groq)').setHeading();

        new Setting(containerEl)
            .setName('API key')
            .setDesc('Your Groq API key from console.groq.com')
            .addText(text => text
                .setPlaceholder('gsk_...')
                .setValue(this.plugin.settings.aiChat.apiKey)
                .then(t => t.inputEl.type = 'password')
                .onChange(async (value) => {
                    this.plugin.settings.aiChat.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Model')
            .setDesc('AI model to use for chat')
            .addDropdown(dropdown => {
                for (const model of GROQ_MODELS) {
                    dropdown.addOption(model.id, model.name);
                }
                dropdown
                    .setValue(this.plugin.settings.aiChat.model)
                    .onChange(async (value) => {
                        this.plugin.settings.aiChat.model = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Creativity level (0 = precise, 1 = creative)')
            .addSlider(slider => slider
                .setLimits(0, 1, 0.1)
                .setValue(this.plugin.settings.aiChat.temperature)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.aiChat.temperature = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max tokens')
            .setDesc('Maximum tokens per response')
            .addText(text => text
                .setValue(String(this.plugin.settings.aiChat.maxTokens))
                .onChange(async (value) => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 0) {
                        this.plugin.settings.aiChat.maxTokens = num;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('System prompt')
            .setDesc('Instructions for the AI assistant')
            .addTextArea(text => text
                .setValue(this.plugin.settings.aiChat.systemPrompt)
                .then(t => {
                    t.inputEl.rows = 4;
                    t.inputEl.addClass('om-settings-textarea-wide');
                })
                .onChange(async (value) => {
                    this.plugin.settings.aiChat.systemPrompt = value;
                    await this.plugin.saveSettings();
                }));

        // ─── Task Board ───
        new Setting(containerEl).setName('Task board').setHeading();

        new Setting(containerEl)
            .setName('Default columns')
            .setDesc('Comma-separated list of default columns for new boards')
            .addText(text => text
                .setValue(this.plugin.settings.taskBoard.defaultColumns.join(', '))
                .onChange(async (value) => {
                    this.plugin.settings.taskBoard.defaultColumns = value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    await this.plugin.saveSettings();
                }));
    }
}
