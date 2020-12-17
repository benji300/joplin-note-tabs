import joplin from 'api';
import { MenuItem, MenuItemLocation, SettingItemType } from 'api/types';

enum NoteTabType {
	Temporary = 1,
	// Open state is currently not used
	Open = 2,
	Pinned = 3
}

// default advanced style values
const DEFAULT: string = "default";
const DEFAULT_FONT: string = "Roboto";
const DEFAULT_BACKGROUND: string = "var(--joplin-background-color3)";
const DEFAULT_ACT_BACKGROUND: string = "var(--joplin-background-color)";
const DEFAULT_FOREGROUND: string = "var(--joplin-color-faded)";
const DEFAULT_ACT_FOREGROUND: string = "var(--joplin-color)";
const DEFAULT_DIVIDER_COLOR: string = "var(--joplin-background-color)";

joplin.plugins.register({
	onStart: async function () {
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('com.benji300.joplin.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-window-maximize',
		});

		// [
		//   {
		//     "id": "note id",
		//     "type": NoteTabType
		//   }
		// ]
		await SETTINGS.registerSetting('noteTabs', {
			value: [],
			type: SettingItemType.Array,
			section: 'com.benji300.joplin.tabs.settings',
			public: false,
			label: 'Note tabs'
		});

		// General settings
		await SETTINGS.registerSetting('showTodoCheckboxes', {
			value: true,
			type: SettingItemType.Bool,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Show checkboxes for to-dos on tabs',
			description: 'If enabled, to-dos can be completed directly on the tabs.'
		});
		await SETTINGS.registerSetting('unpinCompletedTodos', {
			value: false,
			type: SettingItemType.Bool,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Automatically unpin completed to-dos'
		});
		await SETTINGS.registerSetting('tabHeight', {
			value: "40",
			type: SettingItemType.Int,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Note Tabs height (px)',
			description: "Height of the tabs. Row height in vertical layout."
		});
		await SETTINGS.registerSetting('minTabWidth', {
			value: "50",
			type: SettingItemType.Int,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Minimum Tab width (px)'
		});
		await SETTINGS.registerSetting('maxTabWidth', {
			value: "150",
			type: SettingItemType.Int,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			label: 'Maximum Tab width (px)'
		});

		// Advanced styles
		await SETTINGS.registerSetting('fontFamily', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Font family',
			description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font."
		});
		await SETTINGS.registerSetting('mainBackground', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Background color',
			description: "Main background color of the panel."
		});
		await SETTINGS.registerSetting('activeBackground', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active background color',
			description: "Background color of the current active tab."
		});
		await SETTINGS.registerSetting('mainForeground', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Foreground color',
			description: "Default foreground color used for text and icons."
		});
		await SETTINGS.registerSetting('activeForeground', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active foreground color',
			description: "Foreground color of the current active tab."
		});
		await SETTINGS.registerSetting('dividerColor', {
			value: "default",
			type: SettingItemType.String,
			section: 'com.benji300.joplin.tabs.settings',
			public: true,
			advanced: true,
			label: 'Divider color',
			description: "Color of the divider between the tabs."
		});

		//#endregion

		//#region COMMAND HELPER FUNCTIONS

		async function getSettingOrDefault(setting: string, defaultValue: string): Promise<string> {
			const value: string = await SETTINGS.value(setting);
			if (value.match(new RegExp(DEFAULT, "i"))) {
				return defaultValue;
			} else {
				return value;
			}
		}

		function getIndexWithAttr(array: any, attr: any, value: any): number {
			for (var i: number = 0; i < array.length; i += 1) {
				if (array[i][attr] === value) {
					return i;
				}
			}
			return -1;
		}

		async function pinNote(noteId: string) {
			const noteTabs: any = await SETTINGS.value('noteTabs');
			const index: number = getIndexWithAttr(noteTabs, 'id', noteId);

			// if note has not already a tab
			if (index < 0) {
				// add as new one at the end
				await noteTabs.push({ id: noteId, type: NoteTabType.Pinned });
			} else {
				// otherwise change type to pinned
				await noteTabs.splice(index, 1, { id: noteId, type: NoteTabType.Pinned });
			}

			await SETTINGS.setValue('noteTabs', noteTabs);
		}

		// Remove note with handled id from pinned notes array
		async function removeNote(noteId: string) {
			// check if note has a tab, otherwise return
			const noteTabs: any = await SETTINGS.value('noteTabs');
			const index: number = getIndexWithAttr(noteTabs, 'id', noteId);
			if (index < 0) return;

			// remove note from tabs
			await noteTabs.splice(index, 1);
			await SETTINGS.setValue('noteTabs', noteTabs);
		}

		// try to get note from data and toggle their todo state
		async function toggleTodo(noteId: string, checked: any) {
			try {
				const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
				if (note.is_todo && checked) {
					await DATA.put(['notes', note.id], null, { todo_completed: Date.now() });

					// if auto unpin is enabled, remove from noteTabs
					const removeCompleted: boolean = await SETTINGS.value('unpinCompletedTodos');
					if (removeCompleted) {
						await removeNote(noteId);
					}
				} else {
					await DATA.put(['notes', note.id], null, { todo_completed: 0 });
				}
			} catch (error) {
				return;
			}
		}

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
				await pinNote(selectedNote.id);
				await updateTabsPanel();
			}
		});

		// Command: tabsPinToTabs
		// Desc: Pin all handled notes to the tabs
		await COMMANDS.register({
			name: 'tabsPinToTabs',
			label: 'Tabs: Pin to tabs',
			iconName: 'fas fa-thumbtack',
			enabledCondition: "someNotesSelected",
			execute: async (noteIds: string[]) => {
				// pin all handled notes
				for (const noteId of noteIds) {
					await pinNote(noteId);
				}
				// update panel
				await updateTabsPanel();
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
				await removeNote(selectedNote.id);
				await updateTabsPanel();
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

				// check if note is not already first, otherwise exit
				const noteTabs: any = await SETTINGS.value('noteTabs');
				const index: number = getIndexWithAttr(noteTabs, 'id', selectedNote.id);
				if (index <= 0) return;

				// change position of tab and update panel
				const tab: any = noteTabs[index];
				await noteTabs.splice(index, 1);
				await noteTabs.splice(index - 1, 0, tab);
				await SETTINGS.setValue('noteTabs', noteTabs);
				await updateTabsPanel();
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

				// check if note is not already last, otherwise exit
				const noteTabs: any = await SETTINGS.value('noteTabs');
				const index: number = getIndexWithAttr(noteTabs, 'id', selectedNote.id);
				if (index == -1) return;
				if (index == noteTabs.length - 1) return;

				// change position of tab and update panel
				const tab: any = noteTabs[index];
				await noteTabs.splice(index, 1);
				await noteTabs.splice(index + 1, 0, tab);
				await SETTINGS.setValue('noteTabs', noteTabs);
				await updateTabsPanel();
			}
		});

		// Command: tabsSwitchLeft
		// Desc: Switch to left tab, i.e. select left note
		await COMMANDS.register({
			name: 'tabsSwitchLeft',
			label: 'Tabs: Switch to left tab',
			iconName: 'fas fa-step-backward',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await joplin.workspace.selectedNote();
				if (!selectedNote) return;

				// check if note is not already first, otherwise exit
				const noteTabs: any = await SETTINGS.value('noteTabs');
				const index: number = getIndexWithAttr(noteTabs, 'id', selectedNote.id);
				if (index <= 0) return;

				// get id of left pinned note and select it
				await COMMANDS.execute('openNote', noteTabs[index - 1].id);
				// updateTabsPanel is triggered on onNoteSelectionChange event
			}
		});

		// Command: tabsSwitchRight
		// Desc: Switch to right tab, i.e. select right note
		await COMMANDS.register({
			name: 'tabsSwitchRight',
			label: 'Tabs: Switch to right tab',
			iconName: 'fas fa-step-forward',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await joplin.workspace.selectedNote();
				if (!selectedNote) return;

				// check if note is not already last, otherwise exit
				const noteTabs: any = await SETTINGS.value('noteTabs');
				const index: number = getIndexWithAttr(noteTabs, 'id', selectedNote.id);
				if (index == -1) return;
				if (index == noteTabs.length - 1) return;

				// get id of right pinned note and select it
				await COMMANDS.execute('openNote', noteTabs[index + 1].id);
				// updateTabsPanel is triggered on onNoteSelectionChange event
			}
		});

		// Command: tabsClear
		// Desc: Clear all pinned tabs
		await COMMANDS.register({
			name: 'tabsClear',
			label: 'Tabs: Clear all tabs',
			iconName: 'fas fa-times',
			execute: async () => {
				const noteTabs: any = [];
				await SETTINGS.setValue('noteTabs', noteTabs);
				await updateTabsPanel();
			}
		});

		//#endregion

		//#region SETUP PANEL

		// prepare panel object
		const panel = await PANELS.create("com.benji300.joplin.tabs.panel");
		await PANELS.addScript(panel, './assets/fontawesome/css/all.min.css');
		await PANELS.addScript(panel, './webview.css');
		await PANELS.addScript(panel, './webview.js');
		await PANELS.onMessage(panel, async (message: any) => {
			if (message.name === 'tabsOpen') {
				await COMMANDS.execute('openNote', message.id);
			}
			if (message.name === 'tabsPinNote') {
				let id: string[] = [message.id];
				await COMMANDS.execute('tabsPinToTabs', id);
			}
			if (message.name === 'tabsUnpinNote') {
				await removeNote(message.id);
				await updateTabsPanel();
			}
			if (message.name === 'tabsToggleTodo') {
				await toggleTodo(message.id, message.checked);
				await updateTabsPanel();
			}
			if (message.name === 'tabsMoveLeft') {
				await COMMANDS.execute('tabsMoveLeft');
			}
			if (message.name === 'tabsMoveRight') {
				await COMMANDS.execute('tabsMoveRight');
			}
		});

		// update HTML content
		async function updateTabsPanel() {
			const noteTabsHtml: any = [];
			const selectedNote: any = await joplin.workspace.selectedNote();

			// update note tabs array
			var selectedNoteIsNew: boolean = true;
			var tempTabIndex: number = -1;
			var noteTabs: any = await SETTINGS.value('noteTabs');
			for (const noteTab of noteTabs) {
				const index: number = getIndexWithAttr(noteTabs, 'id', noteTab.id);

				// check if note id still exists and remove tab if not
				try {
					await DATA.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });

					if (selectedNote && noteTab.id == selectedNote.id) {
						selectedNoteIsNew = false;
					}

					if (noteTab.type == NoteTabType.Temporary) {
						tempTabIndex = index;
					}
				} catch (error) {
					noteTabs.splice(index, 1);
				}
			}

			// if selected note is not already a tab...
			if (selectedNote) {
				if (selectedNoteIsNew) {
					if (tempTabIndex >= 0) {
						// replace existing temporary tab
						noteTabs.splice(tempTabIndex, 1, { id: selectedNote.id, type: NoteTabType.Temporary });
					} else {
						// add as new temporary tab at the end
						noteTabs.push({ id: selectedNote.id, type: NoteTabType.Temporary });
					}
				}
			}

			// get style values from settings
			const showCheckboxes: boolean = await SETTINGS.value('showTodoCheckboxes');
			const height: number = await SETTINGS.value('tabHeight');
			const minWidth: number = await SETTINGS.value('minTabWidth');
			const maxWidth: number = await SETTINGS.value('maxTabWidth');
			const font: string = await getSettingOrDefault('fontFamily', DEFAULT_FONT);
			const mainBg: string = await getSettingOrDefault('mainBackground', DEFAULT_BACKGROUND);
			const mainFg: string = await getSettingOrDefault('mainForeground', DEFAULT_FOREGROUND);
			const activeBg: string = await getSettingOrDefault('activeBackground', DEFAULT_ACT_BACKGROUND);
			const activeFg: string = await getSettingOrDefault('activeForeground', DEFAULT_ACT_FOREGROUND);
			const dividerColor: string = await getSettingOrDefault('dividerColor', DEFAULT_DIVIDER_COLOR);

			// create HTML for each tab
			for (const noteTab of noteTabs) {
				const note: any = await DATA.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });

				if (note) {
					// prepare tab style attributes
					const background: string = (selectedNote && note.id == selectedNote.id) ? activeBg : mainBg;
					const foreground: string = (selectedNote && note.id == selectedNote.id) ? activeFg : mainFg;
					const activeTab: string = (selectedNote && note.id == selectedNote.id) ? " active" : "";
					const newTab: string = (noteTab.type == NoteTabType.Temporary) ? " new" : "";
					const icon: string = (noteTab.type == NoteTabType.Pinned) ? "fa-times" : "fa-thumbtack";
					const iconTitle: string = (noteTab.type == NoteTabType.Pinned) ? "Unpin" : "Pin";
					const checkbox: string = (showCheckboxes && note.is_todo) ? `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''} data-id="${note.id}">` : '';
					const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

					noteTabsHtml.push(`
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
					`);
				}
			}

			// add tabs to container and push to panel
			await PANELS.setHtml(panel, `
				<div class="container" style="background:${mainBg};font-family:'${font}',sans-serif;">
					<div role="tablist" class="tabs-container">
						${noteTabsHtml.join('\n')}
						<div class="controls" style="height:${height}px;">
							<a href="#" id="moveTabLeft" class="fas fa-chevron-left" title="Move active tab left" style="color:${mainFg};"></a>
							<a href="#" id="moveTabRight" class="fas fa-chevron-right" title="Move active tab right" style="color:${mainFg};"></a>
						</div>
					</div>
				</div>
			`);

			// write note tabs back to settings
			await SETTINGS.setValue('noteTabs', noteTabs);
		}

		//#endregion

		//#region MAP COMMANDS TO MENUS

		// prepare Tools > Tabs menu
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
				commandName: "tabsSwitchLeft",
				label: 'Switch to left tab'
			},
			{
				commandName: "tabsSwitchRight",
				label: 'Switch to right tab'
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
		await joplin.views.menus.create('toolsTabs', 'Tabs', tabsCommandsSubMenu, MenuItemLocation.Tools);

		// add commands to note list context menu
		await joplin.views.menuItems.create('noteListContextMenuPinToTabs', 'tabsPinToTabs', MenuItemLocation.NoteListContextMenu);

		// add commands to editor context menu
		await joplin.views.menuItems.create('editorContextMenuPinNote', 'tabsPinNote', MenuItemLocation.EditorContextMenu);

		//#endregion

		//#region MAP INTERNAL EVENTS

		WORKSPACE.onNoteSelectionChange(() => {
			updateTabsPanel();
		});

		WORKSPACE.onNoteContentChange(() => {
			updateTabsPanel();
		});

		WORKSPACE.onSyncComplete(() => {
			updateTabsPanel();
		});

		//#endregion

		updateTabsPanel();
	},
});
