import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';

// stores the last opened but unpinned note
var lastOpenedNote: any;

joplin.plugins.register({
	onStart: async function () {
		// TODO: remove what not used
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region COMMAND HELPER FUNCTIONS

		function getIndexWithAttr(array: any, attr: any, value: any): number {
			for (var i: number = 0; i < array.length; i += 1) {
				if (array[i][attr] === value) {
					return i;
				}
			}
			return -1;
		}

		async function pinNote(noteId: string) {
			// check if note is not already pinned, otherwise return
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
			if (index != -1) return;

			// check if current note was the last opened note - clear if so
			if (noteId == lastOpenedNote.id) {
				lastOpenedNote = null;
			}

			// pin handled note
			pinnedNotes.push({ id: noteId });
			SETTINGS.setValue('pinnedNotes', pinnedNotes);
		}

		// Remove note with handled id from pinned notes array
		async function unpinNote(noteId: string) {
			// check if note is pinned, otherwise return
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			const index: number = getIndexWithAttr(pinnedNotes, 'id', noteId);
			if (index == -1) return;

			// unpin handled note
			pinnedNotes.splice(index, 1);
			SETTINGS.setValue('pinnedNotes', pinnedNotes);
		}

		// try to get note from data and toggle their todo state
		async function toggleTodo(noteId: string, checked: any) {
			try {
				const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
				if (note.is_todo && checked) {
					await DATA.put(['notes', note.id], null, { todo_completed: Date.now() });
				} else {
					await DATA.put(['notes', note.id], null, { todo_completed: 0 });
				}
			} catch (error) {
				return;
			}
			updateTabsPanel();
		}

		//#endregion

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-window-maximize',
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

		// General settings
		await SETTINGS.registerSetting('unpinCompletedTodos', {
			value: false,
			type: 3,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Automatically unpin completed to-dos'
		});
		await SETTINGS.registerSetting('tabHeight', {
			value: "40",
			type: 1,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Note Tabs height (px)'
		});
		await SETTINGS.registerSetting('minTabWidth', {
			value: "50",
			type: 1,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Minimum Tab width (px)'
		});
		await SETTINGS.registerSetting('maxTabWidth', {
			value: "150",
			type: 1,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Maximum Tab width (px)'
		});

		// Advanced styles
		await SETTINGS.registerSetting('mainBackground', {
			value: "var(--joplin-background-color3)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Background color'
		});
		await SETTINGS.registerSetting('activeBackground', {
			value: "var(--joplin-background-color)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active background color'
		});
		await SETTINGS.registerSetting('mainForeground', {
			value: "var(--joplin-color-faded)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Foreground color'
		});
		await SETTINGS.registerSetting('activeForeground', {
			value: "var(--joplin-color)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active foreground color'
		});
		await SETTINGS.registerSetting('dividerColor', {
			value: "var(--joplin-background-color)",
			type: 2,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Divider color'
		});

		//#endregion

		//#region REGISTER COMMANDS

		// Command: tabsPinNote
		// Desc: Pin the selected note to the tabs
		await COMMANDS.register({
			name: 'tabsPinNote',
			label: 'Tabs: Pin note',
			iconName: 'fas fa-thumbtack',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				// get the selected note and exit if none is currently selected
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// pin selected note and update panel
				pinNote(selectedNote.id);
				updateTabsPanel();
			}
		});

		// Command: tabsUnpinNote
		// Desc: Unpin the selected note from the tabs
		await COMMANDS.register({
			name: 'tabsUnpinNote',
			label: 'Tabs: Unpin note',
			iconName: 'fas fa-times',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				// get the selected note and exit if none is currently selected
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// unpin selected note and update panel
				unpinNote(selectedNote.id);
				updateTabsPanel();
			}
		});

		// Command: tabsMoveLeft
		// Desc: Move active (unpinned) tab to left
		await COMMANDS.register({
			name: 'tabsMoveLeft',
			label: 'Tabs: Move tab left',
			iconName: 'fas fa-chevron-left',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await joplin.workspace.selectedNote();
				if (!selectedNote) return;

				// check if note is pinned and not already first, otherwise exit
				const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
				const index: number = getIndexWithAttr(pinnedNotes, 'id', selectedNote.id);
				if (index == -1) return;
				if (index == 0) return;

				// change position of tab and update panel
				pinnedNotes.splice(index, 1);
				pinnedNotes.splice(index - 1, 0, selectedNote);
				SETTINGS.setValue('pinnedNotes', pinnedNotes);
				updateTabsPanel();
			}
		});

		// Command: tabsMoveRight
		// Desc: Move active (unpinned) tab to right
		await COMMANDS.register({
			name: 'tabsMoveRight',
			label: 'Tabs: Move tab right',
			iconName: 'fas fa-chevron-right',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await joplin.workspace.selectedNote();
				if (!selectedNote) return;

				// check if note is pinned and not already first, otherwise exit
				const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
				const index: number = getIndexWithAttr(pinnedNotes, 'id', selectedNote.id);
				if (index == -1) return;
				if (index == pinnedNotes.length - 1) return;

				// change position of tab and update panel
				pinnedNotes.splice(index, 1);
				pinnedNotes.splice(index + 1, 0, selectedNote);
				SETTINGS.setValue('pinnedNotes', pinnedNotes);
				updateTabsPanel();
			}
		});

		// Command: tabsClear
		// Desc: Clear all pinned tabs
		await COMMANDS.register({
			name: 'tabsClear',
			label: 'Tabs: Clear all tabs',
			iconName: 'fas fa-times',
			execute: async () => {
				const pinnedNotes: any = [];
				SETTINGS.setValue('pinnedNotes', pinnedNotes);
				updateTabsPanel();
			}
		});

		//#endregion

		//#region SETUP PANEL

		// prepare panel object
		const panel = await PANELS.create("com.benji300.joplin.tabs.panel");
		await PANELS.addScript(panel, './fontawesome/css/all.min.css');
		await PANELS.addScript(panel, './webview.css');
		await PANELS.addScript(panel, './webview.js');
		PANELS.onMessage(panel, (message: any) => {
			if (message.name === 'tabsOpen') {
				COMMANDS.execute('openNote', message.id);
			}
			if (message.name === 'tabsPinNote') {
				pinNote(message.id);
				updateTabsPanel();
			}
			if (message.name === 'tabsUnpinNote') {
				unpinNote(message.id);
				updateTabsPanel();
			}
			if (message.name === 'tabsToggleTodo') {
				toggleTodo(message.id, message.checked);
				updateTabsPanel();
			}
			if (message.name === 'tabsMoveLeft') {
				COMMANDS.execute('tabsMoveLeft');
			}
			if (message.name === 'tabsMoveRight') {
				COMMANDS.execute('tabsMoveRight');
			}
		});

		// prepare tab HTML
		async function prepareTabHtml(note: any, selectedNote: any, pinned: boolean): Promise<string> {
			// get style values from settings
			const height: number = await SETTINGS.value('tabHeight');
			const minWidth: number = await SETTINGS.value('minTabWidth');
			const maxWidth: number = await SETTINGS.value('maxTabWidth');
			const mainBg: string = await SETTINGS.value('mainBackground');
			const mainFg: string = await SETTINGS.value('mainForeground');
			const activeBg: string = await SETTINGS.value('activeBackground');
			const activeFg: string = await SETTINGS.value('activeForeground');
			const dividerColor: string = await SETTINGS.value('dividerColor');

			// prepare style attributes
			const background: string = (note.id == selectedNote.id) ? activeBg : mainBg;
			const foreground: string = (note.id == selectedNote.id) ? activeFg : mainFg;
			const activeTab: string = (note.id == selectedNote.id) ? " active" : "";
			const newTab: string = (pinned) ? "" : " new";
			const icon: string = (pinned) ? "fa-times" : "fa-thumbtack";
			const iconTitle: string = (pinned) ? "Unpin" : "Pin";

			const checkbox: string = (note.is_todo) ? `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''} data-id="${note.id}">` : '';
			const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

			const html = `
				<div role="tab" class="tab${activeTab}${newTab}"
					style="height:${height}px;min-width:${minWidth}px;max-width:${maxWidth}px;border-color:${dividerColor};background:${background};">
					<div class="tab-inner" data-id="${note.id}">
						${checkbox}
						<span class="title" data-id="${note.id}" style="color:${foreground};text-decoration: ${textDecoration};">
							${note.title}
						</span>
						<a href="#" id="${iconTitle}" class="fas ${icon}" title="${iconTitle}" data-id="${note.id}" style="color:${foreground};">
						</a>
					</div>
				</div>
			`;
			return html;
		}

		// update HTML content
		async function updateTabsPanel() {
			const tabsHtml: any = [];
			const selectedNote: any = await joplin.workspace.selectedNote();
			var selectedNoteIsNew: boolean = true;

			// add all pinned notes as tabs
			const pinnedNotes: any = await SETTINGS.value('pinnedNotes');
			for (const pinnedNote of pinnedNotes) {
				if (selectedNote && pinnedNote.id == selectedNote.id) {
					selectedNoteIsNew = false;
				}

				// check if note id still exists - otherwise remove from pinned notes and continue with next one
				var note: any = null; // representation of the real note data
				try {
					note = await DATA.get(['notes', pinnedNote.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
				} catch (error) {
					unpinNote(pinnedNote.id);
					continue;
				}

				// check if note is pinned and completed, then unpin it if enabled and continue with next one
				const unpinCompleted: boolean = await SETTINGS.value('unpinCompletedTodos');
				if (unpinCompleted && note.is_todo && note.todo_completed) {
					unpinNote(note.id);
					continue;
				}

				tabsHtml.push((await prepareTabHtml(note, selectedNote, true)).toString());
			}

			// check whether selected note is not pinned but active - than set as lastOpenedNote
			if (selectedNote) {
				if (selectedNoteIsNew) {
					lastOpenedNote = selectedNote;
				} else {
					// if note is already pinned but also still last opened - clear last opened
					if (lastOpenedNote && lastOpenedNote.id == selectedNote.id) {
						lastOpenedNote = null;
					}
				}
			}

			// check whether last opened note still exists - clear if not
			if (lastOpenedNote) {
				try {
					note = await DATA.get(['notes', lastOpenedNote.id], { fields: ['id'] });
				} catch (error) {
					lastOpenedNote = null;
				}
			}

			// add last opened or current selected note at last (unpinned)
			if (lastOpenedNote) {
				tabsHtml.push((await prepareTabHtml(lastOpenedNote, selectedNote, false)).toString());
			}

			// get setting style values
			const height: number = await SETTINGS.value('tabHeight');
			const mainBg: string = await SETTINGS.value('mainBackground');
			const mainFg: string = await SETTINGS.value('mainForeground');

			// add notes to container and push to panel
			await PANELS.setHtml(panel, `
					<div class="container" style="background:${mainBg};">
						<div role="tablist" class="tabs-container">
							${tabsHtml.join('\n')}
							<div class="controls" style="height:${height}px;">
								<a href="#" id="moveTabLeft" class="fas fa-chevron-left" title="Move active tab left" style="color:${mainFg};"></a>
								<a href="#" id="moveTabRight" class="fas fa-chevron-right" title="Move active tab right" style="color:${mainFg};"></a>
							</div>
						</div>
					</div>
				`);
		}

		//#endregion

		//#region MAP COMMANDS TO MENU

		// prepare "Properties" submenu
		const tabsCommandsSubMenu: MenuItem[] = [
			{
				commandName: "tabsPinNote",
				label: 'Pin note'
			},
			{
				commandName: "tabsUnpinNote",
				label: 'Unpin note'
			},
			{
				commandName: "tabsMoveLeft",
				label: 'Move tab left'
			},
			{
				commandName: "tabsMoveRight",
				label: 'Move tab right'
			},
			{
				commandName: "tabsClear",
				label: 'Clear all tabs'
			}
		]

		// add commands to "View" menu
		await joplin.views.menus.create('menuViewTabs', 'Tabs', tabsCommandsSubMenu, MenuItemLocation.Tools);

		//#endregion

		//#region MAP INTERNAL EVENTS

		joplin.workspace.onNoteSelectionChange(() => {
			updateTabsPanel();
		});

		joplin.workspace.onNoteContentChange(() => {
			updateTabsPanel();
		});

		//#endregion

		updateTabsPanel();
	},
});
