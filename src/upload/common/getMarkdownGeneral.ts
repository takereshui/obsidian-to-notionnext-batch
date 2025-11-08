import { App, Notice, TFile } from "obsidian";
import { i18nConfig } from "../../lang/I18n";
import { PluginSettings } from "../../ui/settingTabs";

/**
 * 从指定文件获取 Markdown 内容和元数据(通用格式)
 * @param app Obsidian App 实例
 * @param file 目标文件
 * @param settings 插件设置
 */
export async function getFileMarkdownContentGeneral(
	app: App,
	file: TFile,
	settings: PluginSettings,
) {
	let cover = '';
	let tags = [];

	const FileCache = app.metadataCache.getFileCache(file);
	try {
		cover = FileCache.frontmatter.coverurl;
		tags = FileCache.frontmatter.tags;
	} catch (error) {
		new Notice(i18nConfig["set-tags-fail"]);
	}

	const markDownData = await app.vault.read(file);
	return {
		markDownData,
		nowFile: file,
		cover,
		tags,
	};
}

/**
 * 获取当前活动文件的内容(保持向后兼容)
 * @param app Obsidian App 实例
 * @param settings 插件设置
 */
export async function getNowFileMarkdownContentGeneral(
	app: App,
	settings: PluginSettings,
) {
	const nowFile = app.workspace.getActiveFile();
	
	if (!nowFile) {
		new Notice(i18nConfig["open-file"]);
		return;
	}
	
	return getFileMarkdownContentGeneral(app, nowFile, settings);
}
