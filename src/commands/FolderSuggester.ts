import { FuzzySuggestModal, TFolder } from 'obsidian';
import ObsidianSyncNotionPlugin from '../main';
import { i18nConfig } from '../lang/I18n';

/**
 * 文件夹选择器
 * 用于批量上传功能,允许用户选择要上传的文件夹
 */
export class FolderSuggester extends FuzzySuggestModal<TFolder> {
	private plugin: ObsidianSyncNotionPlugin;
	private callback: (folder: TFolder) => void;

	constructor(plugin: ObsidianSyncNotionPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.setPlaceholder(i18nConfig["select-folder"] || "Select a folder to batch upload");
	}

	/**
	 * 显示文件夹选择器
	 * @param callback 用户选择文件夹后的回调函数
	 */
	async display(callback: (folder: TFolder) => void): Promise<void> {
		this.callback = callback;
		this.open();
	}

	/**
	 * 获取所有文件夹
	 */
	getItems(): TFolder[] {
		const folders: TFolder[] = [];
		const abstractFiles = this.app.vault.getAllLoadedFiles();

		for (const file of abstractFiles) {
			if (file instanceof TFolder) {
				folders.push(file);
			}
		}

		// 按路径排序,方便查找
		folders.sort((a, b) => a.path.localeCompare(b.path));

		return folders;
	}

	/**
	 * 获取文件夹的显示文本
	 */
	getItemText(folder: TFolder): string {
		// 显示完整路径,根目录显示为 "/"
		return folder.path || '/';
	}

	/**
	 * 用户选择文件夹后的处理
	 */
	onChooseItem(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
		if (this.callback) {
			this.callback(folder);
		}
	}
}
