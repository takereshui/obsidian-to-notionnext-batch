import { App, Notice, TFile } from "obsidian";
import { i18nConfig } from "../../lang/I18n";
import { PluginSettings } from "../../ui/settingTabs";

/**
 * 从指定文件获取 Markdown 内容和元数据
 * @param app Obsidian App 实例
 * @param file 目标文件
 * @param settings 插件设置
 */
export async function getFileMarkdownContentNext(
    app: App,
    file: TFile,
    settings: PluginSettings,
) {
    let emoji = '';
    let cover = '';
    let tags = [];
    let type = '';
    let slug = '';
    let stats = '';
    let status = '';
    let category = '';
    let summary = '';
    let paword = '';
    let favicon = '';
    let datetime = '';

    const FileCache = app.metadataCache.getFileCache(file);
    try {
        emoji = FileCache.frontmatter.titleicon;
        cover = FileCache.frontmatter.coverurl;
        tags = FileCache.frontmatter.tags;
        type = FileCache.frontmatter.type;
        slug = FileCache.frontmatter.slug;
        stats = FileCache.frontmatter.stats || FileCache.frontmatter.status;
        category = FileCache.frontmatter.category;
        summary = FileCache.frontmatter.summary;
        paword = FileCache.frontmatter.password;
        favicon = FileCache.frontmatter.icon;
        datetime = FileCache.frontmatter.date;
    } catch (error) {
        new Notice(i18nConfig["set-tags-fail"]);
    }
    const markDownData = await app.vault.read(file);
    return {
        markDownData,
        nowFile: file,
        emoji,
        cover,
        tags,
        type,
        slug,
        stats,
        category,
        summary,
        paword,
        favicon,
        datetime,
    };
}

/**
 * 获取当前活动文件的内容(保持向后兼容)
 * @param app Obsidian App 实例
 * @param settings 插件设置
 */
export async function getNowFileMarkdownContentNext(
    app: App,
    settings: PluginSettings,
) {
    const nowFile = app.workspace.getActiveFile();
    
    if (!nowFile) {
        new Notice(i18nConfig["open-file"]);
        return;
    }
    
    return getFileMarkdownContentNext(app, nowFile, settings);
}
