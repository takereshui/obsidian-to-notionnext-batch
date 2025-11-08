import { TFolder, TFile, App } from 'obsidian';

/**
 * 递归获取文件夹中的所有 Markdown 文件
 * @param folder 目标文件夹
 * @param recursive 是否递归遍历子文件夹
 * @returns Markdown 文件数组
 */
export function getAllMarkdownFilesInFolder(
	folder: TFolder,
	recursive: boolean = true
): TFile[] {
	const markdownFiles: TFile[] = [];

	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === 'md') {
			markdownFiles.push(child);
		} else if (recursive && child instanceof TFolder) {
			markdownFiles.push(...getAllMarkdownFilesInFolder(child, recursive));
		}
	}

	return markdownFiles;
}

/**
 * 过滤出尚未同步到指定数据库的文件
 * @param files 文件数组
 * @param app Obsidian App 实例
 * @param dbAbName 数据库简称
 * @returns 未同步的文件数组
 */
export function filterUnsyncedFiles(
	files: TFile[],
	app: App,
	dbAbName: string
): TFile[] {
	return files.filter(file => {
		const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
		if (!frontmatter) {
			return true; // 没有 frontmatter,视为未同步
		}
		const notionIDKey = `NotionID-${dbAbName}`;
		return !frontmatter[notionIDKey]; // 没有 NotionID,视为未同步
	});
}

/**
 * 获取文件夹的统计信息
 * @param folder 目标文件夹
 * @param recursive 是否递归统计
 * @returns 统计信息对象
 */
export function getFolderStats(
	folder: TFolder,
	recursive: boolean = true
): {
	totalFiles: number;
	markdownFiles: number;
	subFolders: number;
} {
	let totalFiles = 0;
	let markdownFiles = 0;
	let subFolders = 0;

	for (const child of folder.children) {
		if (child instanceof TFile) {
			totalFiles++;
			if (child.extension === 'md') {
				markdownFiles++;
			}
		} else if (child instanceof TFolder) {
			subFolders++;
			if (recursive) {
				const subStats = getFolderStats(child, recursive);
				totalFiles += subStats.totalFiles;
				markdownFiles += subStats.markdownFiles;
				subFolders += subStats.subFolders;
			}
		}
	}

	return { totalFiles, markdownFiles, subFolders };
}
