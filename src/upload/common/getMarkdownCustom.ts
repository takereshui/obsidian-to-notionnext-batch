import {App, Notice, TFile} from "obsidian";
import {i18nConfig} from "../../lang/I18n";
import {DatabaseDetails} from "../../ui/settingTabs";

/**
 * 从指定文件获取 Markdown 内容和元数据(自定义格式)
 * @param app Obsidian App 实例
 * @param file 目标文件
 * @param dbDetails 数据库配置
 */
export async function getFileMarkdownContentCustom(
	app: App,
	file: TFile,
	dbDetails: DatabaseDetails,
) {
	let cover = '';
	let customValues: Record<string, any> = {};

	const FileCache = app.metadataCache.getFileCache(file);
	try {
		cover = FileCache.frontmatter.coverurl;

		// Get custom property names from dbDetails excluding the title type property
		const customPropertyNames = dbDetails.customProperties
			.filter(property => property.customType !== 'title') // Exclude 'title' type property
			.map(property => property.customName);

		// Extract custom values from the front matter based on the names
		// Only collect data 'Relation' should be handled separately in the function buildBodyString
		customPropertyNames.forEach(propertyName => {
			if (FileCache.frontmatter && FileCache.frontmatter[propertyName] !== undefined) {
				customValues[propertyName] = FileCache.frontmatter[propertyName];
			}
		});

		// Check if any of the customProperties has a customType of 'title'
		const titleProperty = dbDetails.customProperties
			.find(property => property.customType === 'title');

		// If a 'title' type property exists, use the file's basename as its value
		if (titleProperty) {
			customValues[titleProperty.customName] =
			(FileCache.frontmatter && FileCache.frontmatter[titleProperty.customName]) ?
				FileCache.frontmatter[titleProperty.customName] : // use the front matter value if it exists
				file.basename; // Use 'basename' for the file name without extension
		}

	} catch (error) {
		new Notice(i18nConfig["set-tags-fail"]);
	}

	const markDownData = await app.vault.read(file);
	return {
		markDownData,
		nowFile: file,
		cover,
		customValues,
	};
}

/**
 * 获取当前活动文件的内容(保持向后兼容)
 * @param app Obsidian App 实例
 * @param dbDetails 数据库配置
 */
export async function getNowFileMarkdownContentCustom(
	app: App,
	dbDetails: DatabaseDetails,
) {
	const nowFile = app.workspace.getActiveFile();
	if (!nowFile) {
		new Notice(i18nConfig["open-file"]);
		return;
	}
	
	return getFileMarkdownContentCustom(app, nowFile, dbDetails);
}
