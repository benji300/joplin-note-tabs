import joplin from 'api';

joplin.plugins.register({
	onStart: async function () {
		// TODO: remove what not used
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const DIALOGS = joplin.views.dialogs;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region INITIALIZE PLUGIN

		// prepare panel object
		const panel = await PANELS.create("com.benji300.joplin.tabs.panel");
		await PANELS.addScript(panel, './webview.js');
		await PANELS.addScript(panel, './webview.css');

		//#endregion

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-music', // TODO: select icon
		});

		// TODO prepare array to store keept notes
		// {
		// 	// multiple instances may be later necessary
		// 	"instances": [
		// 		{
		// 			"tabs": [
		// 				{
		// 					"id": "123",
		// 					"name": "Tab name",
		// 					"order": "456"
		// 				}
		// 			]
		// 		}
		// 	]
		// }


		//#endregion

		//#region REGISTER COMMANDS

		// TODO keepNote
		// add current note the internal storage
		// order = now()

		// TODO unkeepNote
		// 

		//#endregion

		//#region Setup panel

		// setup HTML content
		async function updateTabsPanel() {
			const note = await joplin.workspace.selectedNote();

			// collect notes to be shown
			// TODO get all notes from settings sorted by their order (highest value > right most)
			// TODO check if current note is in list
			//  - if yes set to active and save for later
			//  add one entry for each note

			// TODO create one "new" entry for selected note if not already in list

			// add notes to container and push to panel

			await PANELS.setHtml(panel, `
					<div class="main-container">
						<div class="tabs-container">
							<div class="tab-item">
								<a class="tab-title" href="#" data-id="id">Note 1</a>
								<span class="tab-icon unkeep">x</span>
							</div>
							<div class="tab-item active">
								<a class="tab-title new" href="#" data-id="id">Note 2</a>
								<span class="tab-icon keep">?</span>
							</div>
						</div>
					</div>
				`);
		}

		// handle messages from webview
		PANELS.onMessage(panel, (message: any) => {

			// open note
			if (message.name === 'com.benji300.joplin.tabs.openNote') {
				// TODO trigger internal command to selectNote (siehe changelog)
				// joplin.commands.execute('scrollToHash', message.hash)
			}

			// keep note
			if (message.name === 'com.benji300.joplin.tabs.keepNote') {
				// TODO
				// joplin.commands.execute('scrollToHash', message.hash)
			}

			// unkeep note
			if (message.name === 'com.benji300.joplin.tabs.unkeepNote') {
				// TODO
				// joplin.commands.execute('scrollToHash', message.hash)
			}
		});

		//#endregion

		//#region Map events

		joplin.workspace.onNoteSelectionChange(() => {
			updateTabsPanel();
		});

		//#endregion

		updateTabsPanel();
		console.info('com.benji300.joplin.tabs started!');
	},
});
