import joplin from 'api';

joplin.plugins.register({
	onStart: async function () {
		// TODO: remove what not used
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-music', // TODO: select icon
		});

		// [
		//   {
		//     "id": "note id"
		//   }
		// ]
		await SETTINGS.registerSetting('pinnedNotes', {
			value: [],
			type: 4,
			section: 'com.benji300.joplin.tabs.settings',
			public: false,
			label: 'Pinned Notes',
			description: 'List of pinned notes.'
		});

		// TODO add setting for tabs-list height

		//#endregion

		//#region helper functions

		// function getItemWithAttr(array: any, attr: any, value: any): any {
		// 	for (var i = 0; i < array.length; i += 1) {
		// 		if (array[i][attr] === value) {
		// 			return array[i];
		// 		}
		// 	}
		// 	return -1;
		// }

		function getIndexWithAttr(array: any, attr: any, value: any): number {
			for (var i: number = 0; i < array.length; i += 1) {
				if (array[i][attr] === value) {
					return i;
				}
			}
			return -1;
		}

		// Add note with handled id to pinned notes array
		async function pinNote(noteId: string) {
			// check if note is not already pinned, otherwise return
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
			if (index != -1) return;

			// pin selected note and update panel
			pinnedNotes.push({ id: noteId });
			SETTINGS.setValue('pinnedNotes', pinnedNotes);
			console.info(`${JSON.stringify(pinnedNotes)}`);
		}

		// Remove note with handled id from pinned notes array
		async function unpinNote(noteId: string) {
			// check if note is pinned, otherwise return
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
			if (index == -1) return;

			// unpin selected note and update panel
			pinnedNotes.splice(index, 1);
			SETTINGS.setValue('pinnedNotes', pinnedNotes);
		}

		//#endregion

		//#region REGISTER COMMANDS

		// Command: pinNote
		// Desc: Pin the selected note to the tabs
		await COMMANDS.register({
			name: 'pinNote',
			label: 'Pin note',
			iconName: 'fas fa-thumbtack',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				// get the selected note and exit if none is currently selected
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				pinNote(selectedNote.id);
				updateTabsPanel();
			}
		});

		// Command: unpinNote
		// Desc: Unpin the selected note from the tabs
		await COMMANDS.register({
			name: 'unpinNote',
			label: 'Unpin note',
			iconName: 'fas fa-times',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				// get the selected note and exit if none is currently selected
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// unpin note and update panel
				unpinNote(selectedNote.id);
				updateTabsPanel();
			}
		});

		// Command: clearTabs
		// Desc: Clear all pinned tabs
		await COMMANDS.register({
			name: 'clearTabs',
			label: 'Clear all note tabs',
			iconName: 'fas fa-times',
			execute: async () => {
				const pinnedNotes: any = [];
				SETTINGS.setValue('pinnedNotes', pinnedNotes);
				updateTabsPanel();
			}
		});

		//#endregion

		//#region Setup panel

		// prepare panel object
		const panel = await PANELS.create("com.benji300.joplin.tabs.panel");
		await PANELS.addScript(panel, './webview.css');
		await PANELS.addScript(panel, './fa/css/all.css');
		await PANELS.addScript(panel, './webview.js');
		PANELS.onMessage(panel, (message: any) => {
			// TODO currently post message is not reached
			// Remove console outputs when working
			console.info('message received');
			if (message.name === 'openNote') {
				console.info('openNote');
				joplin.commands.execute('openNote', message.id);
			}
			if (message.name === 'pinNote') {
				console.info('pinNote');
				pinNote(message.id);
				updateTabsPanel();
			}
			if (message.name === 'unpinNote') {
				console.info('unpinNote');
				unpinNote(message.id);
				updateTabsPanel();
			}
		});

		// update HTML content
		async function updateTabsPanel() {
			const tabsHtml: any = [];
			const selectedNote: any = await joplin.workspace.selectedNote();
			var selectedNoteIsNew: boolean = true;

			// add all pinned notes as tabs
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			for (const pinnedNote of pinnedNotes) {
				var note: any = null;

				// check if note id still exists - otherwise remove from pinned notes and continue with next one
				try {
					note = await DATA.get(['notes', pinnedNote.id], { fields: ['id', 'title'] });
				} catch (error) {
					unpinNote(pinnedNote.id);
					continue;
				}

				var active: string = "";
				if (pinnedNote.id == selectedNote.id) {
					selectedNoteIsNew = false;
					active = " active";
				}

				tabsHtml.push(`
					<div role="tab" class="tab${active}" style="height:40px">
						<div class="tab-inner" data-id="${note.id}">
							<span class="title" data-id="${note.id}">${note.title}</span>
							<a href="#" class="fas fa-times" title="Unpin" data-id="${note.id}"></a>
						</div>
					</div>
				`);
			}

			// if selected note is not already pinned - add is as "new" tab
			if (selectedNoteIsNew) {
				tabsHtml.push(`
					<div role="tab" class="tab active new" style="height:40px">
						<div class="tab-inner" data-id="${selectedNote.id}">
							<span class="title" data-id="${selectedNote.id}">${selectedNote.title}</span>
							<a href="#" class="fas fa-thumbtack" title="Pin" data-id="${selectedNote.id}"></a>
						</div>
					</div>
				`);
			}

			// add notes to container and push to panel
			await PANELS.setHtml(panel, `
				<div class="container" style="height:40px">
					<div role="tablist" class="tabs-container">
						${tabsHtml.join('\n')}
					</div>
					<div class="controls">
						<button class="move-left">
							<i class="fas fa-chevron-left"></i>
						</button>
						<button class="move-right">
						<i class="fas fa-chevron-right"></i>
						</button>
					</div>
				</div>
				`);
		}

		//#endregion

		//#region Map events

		joplin.workspace.onNoteSelectionChange(() => {
			updateTabsPanel();
		});

		joplin.workspace.onNoteContentChange(() => {
			updateTabsPanel();
		});

		//#endregion

		updateTabsPanel();
		console.info('com.benji300.joplin.tabs started!');
	},
});
