import { App, Notice, TFile, TFolder } from "obsidian";
import { i18nConfig } from "../lang/I18n";
import { Upload2Notion } from "./Upload2Notion";
import type { NotionPageResponse } from "./common/UploadBase";
import { DatabaseDetails, PluginSettings } from "../ui/settingTabs";
import ObsidianSyncNotionPlugin from "../main";
import { getAllMarkdownFilesInFolder } from "./common/fileUtils";
import { getFileMarkdownContentNext } from "./common/getMarkdownNext";
import { getFileMarkdownContentGeneral } from "./common/getMarkdownGeneral";
import { getFileMarkdownContentCustom } from "./common/getMarkdownCustom";

/**
 * 批量上传结果
 */
export interface BatchUploadResult {
	total: number;
	success: number;
	failed: number;
	skipped: number;
	errors: { file: string; error: string }[];
}

/**
 * 批量上传文件夹中的所有 Markdown 文件到 NotionNext 数据库
 */
export async function batchUploadCommandNext(
	plugin: ObsidianSyncNotionPlugin,
	settings: PluginSettings,
	dbDetails: DatabaseDetails,
	app: App,
	folder: TFolder,
	recursive: boolean = true
): Promise<BatchUploadResult> {
	const { notionAPI, databaseID } = dbDetails;
	
	if (notionAPI === "" || databaseID === "") {
		new Notice(i18nConfig["set-api-id"]);
		return { total: 0, success: 0, failed: 0, skipped: 0, errors: [] };
	}

	// 获取所有 Markdown 文件
	const files = getAllMarkdownFilesInFolder(folder, recursive);
	const result: BatchUploadResult = {
		total: files.length,
		success: 0,
		failed: 0,
		skipped: 0,
		errors: []
	};

	if (files.length === 0) {
		new Notice(`${i18nConfig["no-markdown-files"] || "No Markdown files found"} in ${folder.path}`);
		return result;
	}

	new Notice(`${i18nConfig["batch-upload-start"] || "Starting batch upload"}: ${files.length} files from ${folder.path}`);
	console.log(`[batchUploadCommandNext] Starting batch upload`, {
		folder: folder.path,
		fileCount: files.length,
		database: dbDetails.fullName,
		recursive
	});

	// 逐个上传文件
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const progress = `[${i + 1}/${files.length}]`;
		
		try {
			console.log(`${progress} Processing ${file.path}`);
			
			// 获取文件内容和元数据
			const fileData = await getFileMarkdownContentNext(app, file, settings);
			
			if (!fileData || !fileData.markDownData) {
				console.warn(`${progress} Skipping ${file.path}: No content`);
				result.skipped++;
				continue;
			}

			const { markDownData, emoji, cover, tags, type, slug, stats, 
					category, summary, paword, favicon, datetime } = fileData;

			// 创建上传实例并同步
			const upload = new Upload2Notion(plugin, dbDetails);
			const res: NotionPageResponse = await upload.sync({
				dataset: "next",
				title: file.basename,
				emoji: emoji || "",
				cover: cover || "",
				tags: tags || [],
				type: type || "",
				slug: slug || "",
				stats: stats || "",
				category: category || "",
				summary: summary || "",
				password: paword || "",
				favicon: favicon || "",
				datetime: datetime || "",
				markdown: markDownData,
				nowFile: file,
				app,
			});

			if (res.response.status === 200) {
				result.success++;
				console.log(`${progress} ✓ ${file.basename}`);
			} else {
				result.failed++;
				const errorMsg = `Status ${res.response.status}`;
				result.errors.push({ file: file.path, error: errorMsg });
				console.error(`${progress} ✗ ${file.basename}: ${errorMsg}`);
			}

		} catch (error) {
			result.failed++;
			const errorMsg = error instanceof Error ? error.message : String(error);
			result.errors.push({ file: file.path, error: errorMsg });
			console.error(`${progress} ✗ ${file.basename}:`, error);
		}

		// 显示进度通知(每 5 个文件更新一次,或最后一个文件)
		if ((i + 1) % 5 === 0 || i === files.length - 1) {
			new Notice(
				`${i18nConfig["batch-upload-progress"] || "Batch upload progress"}: ${i + 1}/${files.length} (${result.success} success, ${result.failed} failed)`,
				2000
			);
		}

		// 添加小延迟,避免 API 限流
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	return result;
}

/**
 * 批量上传到通用数据库
 */
export async function batchUploadCommandGeneral(
	plugin: ObsidianSyncNotionPlugin,
	settings: PluginSettings,
	dbDetails: DatabaseDetails,
	app: App,
	folder: TFolder,
	recursive: boolean = true
): Promise<BatchUploadResult> {
	const { notionAPI, databaseID } = dbDetails;
	
	if (notionAPI === "" || databaseID === "") {
		new Notice(i18nConfig["set-api-id"]);
		return { total: 0, success: 0, failed: 0, skipped: 0, errors: [] };
	}

	const files = getAllMarkdownFilesInFolder(folder, recursive);
	const result: BatchUploadResult = {
		total: files.length,
		success: 0,
		failed: 0,
		skipped: 0,
		errors: []
	};

	if (files.length === 0) {
		new Notice(`${i18nConfig["no-markdown-files"] || "No Markdown files found"} in ${folder.path}`);
		return result;
	}

	new Notice(`${i18nConfig["batch-upload-start"] || "Starting batch upload"}: ${files.length} files from ${folder.path}`);
	console.log(`[batchUploadCommandGeneral] Starting batch upload`, {
		folder: folder.path,
		fileCount: files.length,
		database: dbDetails.fullName,
		recursive
	});

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const progress = `[${i + 1}/${files.length}]`;
		
		try {
			console.log(`${progress} Processing ${file.path}`);
			
			const fileData = await getFileMarkdownContentGeneral(app, file, settings);
			
			if (!fileData || !fileData.markDownData) {
				console.warn(`${progress} Skipping ${file.path}: No content`);
				result.skipped++;
				continue;
			}

			const { markDownData, cover, tags } = fileData;

			const upload = new Upload2Notion(plugin, dbDetails);
			const res: NotionPageResponse = await upload.sync({
				dataset: "general",
				title: file.basename,
				cover: cover || "",
				tags: tags || [],
				markdown: markDownData,
				nowFile: file,
				app,
			});

			if (res.response.status === 200) {
				result.success++;
				console.log(`${progress} ✓ ${file.basename}`);
			} else {
				result.failed++;
				const errorMsg = `Status ${res.response.status}`;
				result.errors.push({ file: file.path, error: errorMsg });
				console.error(`${progress} ✗ ${file.basename}: ${errorMsg}`);
			}

		} catch (error) {
			result.failed++;
			const errorMsg = error instanceof Error ? error.message : String(error);
			result.errors.push({ file: file.path, error: errorMsg });
			console.error(`${progress} ✗ ${file.basename}:`, error);
		}

		if ((i + 1) % 5 === 0 || i === files.length - 1) {
			new Notice(
				`${i18nConfig["batch-upload-progress"] || "Batch upload progress"}: ${i + 1}/${files.length} (${result.success} success, ${result.failed} failed)`,
				2000
			);
		}

		await new Promise(resolve => setTimeout(resolve, 100));
	}

	return result;
}

/**
 * 批量上传到自定义数据库
 */
export async function batchUploadCommandCustom(
	plugin: ObsidianSyncNotionPlugin,
	settings: PluginSettings,
	dbDetails: DatabaseDetails,
	app: App,
	folder: TFolder,
	recursive: boolean = true
): Promise<BatchUploadResult> {
	const { notionAPI, databaseID } = dbDetails;
	
	if (notionAPI === "" || databaseID === "") {
		new Notice(i18nConfig["set-api-id"]);
		return { total: 0, success: 0, failed: 0, skipped: 0, errors: [] };
	}

	const files = getAllMarkdownFilesInFolder(folder, recursive);
	const result: BatchUploadResult = {
		total: files.length,
		success: 0,
		failed: 0,
		skipped: 0,
		errors: []
	};

	if (files.length === 0) {
		new Notice(`${i18nConfig["no-markdown-files"] || "No Markdown files found"} in ${folder.path}`);
		return result;
	}

	new Notice(`${i18nConfig["batch-upload-start"] || "Starting batch upload"}: ${files.length} files from ${folder.path}`);
	console.log(`[batchUploadCommandCustom] Starting batch upload`, {
		folder: folder.path,
		fileCount: files.length,
		database: dbDetails.fullName,
		recursive
	});

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const progress = `[${i + 1}/${files.length}]`;
		
		try {
			console.log(`${progress} Processing ${file.path}`);
			
			const fileData = await getFileMarkdownContentCustom(app, file, dbDetails);
			
			if (!fileData || !fileData.markDownData) {
				console.warn(`${progress} Skipping ${file.path}: No content`);
				result.skipped++;
				continue;
			}

			const { markDownData, cover, customValues } = fileData;

			const upload = new Upload2Notion(plugin, dbDetails);
			const res: NotionPageResponse = await upload.sync({
				dataset: "custom",
				cover: cover || "",
				customValues,
				markdown: markDownData,
				nowFile: file,
				app,
			});

			if (res.response.status === 200) {
				result.success++;
				console.log(`${progress} ✓ ${file.basename}`);
			} else {
				result.failed++;
				const errorMsg = `Status ${res.response.status}`;
				result.errors.push({ file: file.path, error: errorMsg });
				console.error(`${progress} ✗ ${file.basename}: ${errorMsg}`);
			}

		} catch (error) {
			result.failed++;
			const errorMsg = error instanceof Error ? error.message : String(error);
			result.errors.push({ file: file.path, error: errorMsg });
			console.error(`${progress} ✗ ${file.basename}:`, error);
		}

		if ((i + 1) % 5 === 0 || i === files.length - 1) {
			new Notice(
				`${i18nConfig["batch-upload-progress"] || "Batch upload progress"}: ${i + 1}/${files.length} (${result.success} success, ${result.failed} failed)`,
				2000
			);
		}

		await new Promise(resolve => setTimeout(resolve, 100));
	}

	return result;
}

/**
 * 显示批量上传结果汇总
 */
export function showBatchUploadSummary(result: BatchUploadResult, folderPath: string): void {
	const { total, success, failed, skipped, errors } = result;
	
	let message = `${i18nConfig["batch-upload-complete"] || "Batch upload completed"} for ${folderPath}\n`;
	message += `Total: ${total} | Success: ${success} | Failed: ${failed} | Skipped: ${skipped}`;
	
	if (errors.length > 0) {
		message += `\n\nFailed files:\n`;
		errors.slice(0, 5).forEach(e => {
			const fileName = e.file.split('/').pop();
			message += `- ${fileName}: ${e.error}\n`;
		});
		if (errors.length > 5) {
			message += `... and ${errors.length - 5} more errors (check console)`;
		}
	}
	
	new Notice(message, 10000);
	console.log(`[Batch Upload Summary]`, result);
}
