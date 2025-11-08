import { i18nConfig } from "src/lang/I18n";
import { Editor, MarkdownView, setTooltip } from "obsidian";
import { FuzzySuggester, DatabaseList } from "./FuzzySuggester";
import { FolderSuggester } from "./FolderSuggester";
import { uploadCommandCustom, uploadCommandGeneral, uploadCommandNext } from "../upload/uploadCommand";
import { 
	batchUploadCommandNext, 
	batchUploadCommandGeneral, 
	batchUploadCommandCustom,
	showBatchUploadSummary 
} from "../upload/batchUploadCommand";
import ObsidianSyncNotionPlugin from "src/main";
import { DatabaseDetails } from "../ui/settingTabs";


interface Command {
	id: string;
	name: string;
	editorCallback: (editor: Editor, view: MarkdownView) => Promise<void>;
}


// create the commands list
export default class RibbonCommands {
	plugin: ObsidianSyncNotionPlugin;

	Ncommand: Command[] = [];

	constructor(plugin: ObsidianSyncNotionPlugin) {
		this.plugin = plugin;

		// iterate through the database detail

		for (let key in this.plugin.settings.databaseDetails) {
			let dbDetails = this.plugin.settings.databaseDetails[key];
			this.addCommandForDatabase(dbDetails);
		}

		// Register all the commands
		this.Ncommand.forEach(command => {
			this.plugin.addCommand(
				{
					id: command.id,
					name: command.name,
					editorCallback: command.editorCallback,
				}
			);
		});
	}

	async ribbonDisplay() {
		const NcommandList: DatabaseList[] = [];

		this.Ncommand.map(command => NcommandList.push(
			{
				name: command.name,
				match: command.editorCallback
			}
		)
		);

		const fusg = new FuzzySuggester(this.plugin);

		fusg.setSuggesterData(NcommandList);
		await fusg.display(async (results) => { await results.match() })
	};

	// if the setting has been changed, try to rebuild the command list
	async updateCommand() {

		this.Ncommand = [];

		for (let key in this.plugin.settings.databaseDetails) {
			let dbDetails = this.plugin.settings.databaseDetails[key];
			this.addCommandForDatabase(dbDetails);
		}

		this.Ncommand.forEach(command => {
			this.plugin.addCommand(
				{
					id: command.id,
					name: command.name,
					editorCallback: command.editorCallback,
				}
			);
		});
	}

	private addCommandForDatabase(dbDetails: DatabaseDetails) {
		// 添加单文件上传命令
		let commandId = `share-to-${dbDetails.abName}`;
		let commandName = `Share to ${dbDetails.fullName} (${dbDetails.abName})`;

		let editorCallback: (editor: Editor, view: MarkdownView) => Promise<void>;
		if (dbDetails.format === 'next') {
			editorCallback = async (editor, view) => {
				await uploadCommandNext(this.plugin, this.plugin.settings, dbDetails, this.plugin.app);
			};
		} else if (dbDetails.format === 'general') {
			editorCallback = async (editor, view) => {
				await uploadCommandGeneral(this.plugin, this.plugin.settings, dbDetails, this.plugin.app);
			};
		}
		else if (dbDetails.format === 'custom') {
			editorCallback = async (editor, view) => {
				await uploadCommandCustom(this.plugin, this.plugin.settings, dbDetails, this.plugin.app);
			};
		}

		this.Ncommand.push({ id: commandId, name: commandName, editorCallback });

		// 添加批量上传命令
		let batchCommandId = `batch-upload-to-${dbDetails.abName}`;
		let batchCommandName = `Batch Upload Folder to ${dbDetails.fullName} (${dbDetails.abName})`;

		this.plugin.addCommand({
			id: batchCommandId,
			name: batchCommandName,
			callback: async () => {
				const folderSuggester = new FolderSuggester(this.plugin);
				folderSuggester.display(async (folder) => {
					let result;
					if (dbDetails.format === 'next') {
						result = await batchUploadCommandNext(
							this.plugin, 
							this.plugin.settings, 
							dbDetails, 
							this.plugin.app, 
							folder
						);
					} else if (dbDetails.format === 'general') {
						result = await batchUploadCommandGeneral(
							this.plugin, 
							this.plugin.settings, 
							dbDetails, 
							this.plugin.app, 
							folder
						);
					} else if (dbDetails.format === 'custom') {
						result = await batchUploadCommandCustom(
							this.plugin, 
							this.plugin.settings, 
							dbDetails, 
							this.plugin.app, 
							folder
						);
					}
					
					if (result) {
						showBatchUploadSummary(result, folder.path);
					}
				});
			}
		});
	}


}
