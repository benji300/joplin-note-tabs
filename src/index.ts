import joplin from 'api';

// helper functions
function getItemWithAttr(array: any, attr: any, value: any): any {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return array[i];
		}
	}
	return -1;
}

function getIndexWithAttr(array: any, attr: any, value: any): number {
	for (var i: number = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}

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

		//#endregion

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-music', // TODO: select icon
		});

		// [
		//   {
		//     "id": "note id",
		//     "title": "note title"
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

		//#region REGISTER COMMANDS

		// Command: pinNote
		// Desc: Pin the selected note to the tabs
		await COMMANDS.register({
			name: 'pinNote',
			label: 'Pin note',
			iconName: 'fas fa-thumbtack',
			enabledCondition: "oneNoteSelected",
			execute: async (id: string) => {
				// get the noteId either from selectedNote or argument
				var noteId: string = null;
				var noteTitle: string = null;
				if (id) {
					const note: any = await DATA.get(['notes', id], { fields: ['id', 'title'] });
					noteId = note.id;
					noteTitle = note.title;
				} else {
					const selectedNote = await WORKSPACE.selectedNote();
					if (selectedNote) {
						noteId = selectedNote.id;
						noteTitle = selectedNote.title;
					}
				}
				if (noteId == null) return;
				if (noteTitle == null) return;

				// check if note is not already pinned, otherwise return
				const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
				const note: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
				if (note != -1) return;

				// pin selected note and update panel
				pinnedNotes.push({ id: noteId, title: noteTitle });
				SETTINGS.setValue('pinnedNotes', pinnedNotes);

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
			execute: async (id: string) => {
				// get the noteId either from selectedNote or argument
				var noteId: string = null;
				if (id) {
					noteId = id;
				} else {
					const selectedNote = await WORKSPACE.selectedNote();
					if (selectedNote) noteId = selectedNote.id;
				}
				if (noteId == null) return;

				// check if note is pinned, otherwise return
				const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
				const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
				if (index == -1) return;

				// unpin selected note and update panel
				pinnedNotes.splice(index, 1);
				SETTINGS.setValue('pinnedNotes', pinnedNotes);
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
		await PANELS.addScript(panel, './webview.js');
		await PANELS.addScript(panel, './webview.css');
		PANELS.onMessage(panel, (message: any) => {
			console.info('message received');

			if (message.name === 'openNote') {
				console.info('openNote');
				joplin.commands.execute('openNote', message.id);
			}
			if (message.name === 'pinNote') {
				console.info('pinNote');
				joplin.commands.execute('pinNote', message.id);
			}
			if (message.name === 'unpinNote') {
				console.info('unpinNote');
				joplin.commands.execute('unpinNote', message.id);
			}
		});

		// update HTML content
		async function updateTabsPanel() {
			const tabsHtml: any = [];
			const selectedNote: any = await joplin.workspace.selectedNote();
			var selectedNoteIsNew: boolean = true;

			// add all pinned notes as tabs
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			for (const note of pinnedNotes) {

				// TODO: check if note id still exists - otherwise remove from pinned notes
				var active: string = "";
				if (note.id == selectedNote.id) {
					selectedNoteIsNew = false;
					active = " active";
				}

				tabsHtml.push(`
					<div role="tab" class="tab${active}">
						<div class="tab-inner" data-id="${note.id}">
							<span class="title" data-id="${note.id}">
								${note.title}
							</span>
							<a href="#" class="icon-unpin" title="Unpin" data-id="${note.id}">x</a>
						</div>
					</div>
				`);
			}

			// if selected note is not already pinned - add is as "new" tab
			if (selectedNoteIsNew) {
				tabsHtml.push(`
					<div role="tab" class="tab active new">
						<div class="tab-inner" data-id="${selectedNote.id}">
							<span class="title" data-id="${selectedNote.id}">
								${selectedNote.title}
							</span>
							<a href="#" class="icon-pin" title="Pin" data-id="${selectedNote.id}">!</a>
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
						<button class="move-left">&lt;</>
						<button class="move-right">&gt;</>
					</div>
				</div>
				`);

			// update pinned notes array (maybe some were removed)
			SETTINGS.setValue('pinnedNotes', pinnedNotes);
		}

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
