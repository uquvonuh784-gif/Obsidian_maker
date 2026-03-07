import { PluginModule } from './types';

/**
 * Реестр модулей (feature-менеджер).
 * Хранит все зарегистрированные модули и вызывает их lifecycle-методы.
 */
export class ModuleRegistry {
    private modules: PluginModule[] = [];

    /** Добавить модуль в реестр */
    add(mod: PluginModule): void {
        this.modules.push(mod);
    }

    /** Загрузить все модули (вызвать register для каждого) */
    async loadAll(): Promise<void> {
        for (const mod of this.modules) {
            try {
                await mod.register();
                console.debug(`[Obsidian Maker] Module loaded: ${mod.name}`);
            } catch (err) {
                console.error(`[Obsidian Maker] Failed to load module "${mod.name}":`, err);
            }
        }
    }

    /** Выгрузить все модули (вызвать unregister для каждого, в обратном порядке) */
    async unloadAll(): Promise<void> {
        for (const mod of [...this.modules].reverse()) {
            try {
                await mod.unregister();
                console.debug(`[Obsidian Maker] Module unloaded: ${mod.name}`);
            } catch (err) {
                console.error(`[Obsidian Maker] Failed to unload module "${mod.name}":`, err);
            }
        }
        this.modules = [];
    }

    /** Получить модуль по ID */
    get(id: string): PluginModule | undefined {
        return this.modules.find(m => m.id === id);
    }

    /** Получить все модули */
    getAll(): ReadonlyArray<PluginModule> {
        return this.modules;
    }
}
