import { Plugin } from 'obsidian';
import { ModuleRegistry } from './core/module-registry';
import {
	DEFAULT_SETTINGS,
	ObsidianMakerSettings,
	ObsidianMakerSettingTab,
} from './core/settings';
import { AiChatModule } from './features/ai-chat';
import { ScriptButtonsModule } from './features/script-buttons';
import { TextTransformModule } from './features/text-transform';

export default class ObsidianMaker extends Plugin {
	settings: ObsidianMakerSettings;
	modules: ModuleRegistry = new ModuleRegistry();

	async onload() {
		// 1. Загрузка настроек
		await this.loadSettings();

		// 2. Регистрация вкладки настроек
		this.addSettingTab(new ObsidianMakerSettingTab(this.app, this));

		// 3. Регистрация feature-модулей
		this.modules.add(new AiChatModule(this));
		this.modules.add(new ScriptButtonsModule(this));
		this.modules.add(new TextTransformModule(this));

		// 4. Загрузка всех модулей
		await this.modules.loadAll();
	}

	onunload() {
		void this.modules.unloadAll();
	}

	async loadSettings() {
		const data = await this.loadData() as Partial<ObsidianMakerSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

		// Deep merge для вложенных объектов
		this.settings.aiChat = Object.assign({}, DEFAULT_SETTINGS.aiChat, data?.aiChat);
		this.settings.taskBoard = Object.assign({}, DEFAULT_SETTINGS.taskBoard, data?.taskBoard);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
