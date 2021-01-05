import joplin from 'api';
import { MenuItem, MenuItemLocation, SettingItemType } from 'api/types';
import { NoteTabType, SettingDefaults, NoteTabs, LastActiveNoteQueue } from './helpers';

joplin.plugins.register({
	onStart: async function () {
		const COMMANDS = joplin.commands;
		const DATA = joplin.data;
		const DIALOGS = joplin.views.dialogs;
		const PANELS = joplin.views.panels;
		const SETTINGS = joplin.settings;
		const WORKSPACE = joplin.workspace;

		//#region REGISTER USER OPTIONS

		await SETTINGS.registerSection('note.tabs.settings', {
			label: 'Note Tabs',
			iconName: 'fas fa-window-maximize',
			description: 'Changes are applied after selecting another note.'
		});

		await SETTINGS.registerSetting('noteTabs', {
			value: [],
			type: SettingItemType.Array,
			section: 'note.tabs.settings',
			public: false,
			label: 'Note tabs'
		});

		// General settings
		await SETTINGS.registerSetting('enableDragAndDrop', {
			value: true,
			type: SettingItemType.Bool,
			section: 'note.tabs.settings',
			public: true,
			label: 'Enable drag & drop of tabs',
			description: 'If disabled, position of tabs can be change via commands or move buttons.'
		});
		await SETTINGS.registerSetting('showTodoCheckboxes', {
			value: true,
			type: SettingItemType.Bool,
			section: 'note.tabs.settings',
			public: true,
			label: 'Show checkboxes for to-dos on tabs',
			description: 'If enabled, to-dos can be completed directly on the tabs.'
		});
		await SETTINGS.registerSetting('pinEditedNotes', {
			value: false,
			type: SettingItemType.Bool,
			section: 'note.tabs.settings',
			public: true,
			label: 'Automatically pin notes when edited',
			description: 'Pin notes automatically as soon as the title, content or any other attribute changes.'
		});
		await SETTINGS.registerSetting('unpinCompletedTodos', {
			value: false,
			type: SettingItemType.Bool,
			section: 'note.tabs.settings',
			public: true,
			label: 'Automatically unpin completed to-dos',
			description: 'Unpin notes automatically as soon as the to-do status changes to completed. Removes the tab completely unless it is the selected note.'
		});
		await SETTINGS.registerSetting('tabHeight', {
			value: "40",
			type: SettingItemType.Int,
			section: 'note.tabs.settings',
			public: true,
			label: 'Note Tabs height (px)',
			description: "Height of the tabs. Row height in vertical layout."
		});
		await SETTINGS.registerSetting('minTabWidth', {
			value: "50",
			type: SettingItemType.Int,
			section: 'note.tabs.settings',
			public: true,
			label: 'Minimum Tab width (px)'
		});
		await SETTINGS.registerSetting('maxTabWidth', {
			value: "150",
			type: SettingItemType.Int,
			section: 'note.tabs.settings',
			public: true,
			label: 'Maximum Tab width (px)'
		});

		// Advanced styles
		await SETTINGS.registerSetting('fontFamily', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Font family',
			description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: Roboto)"
		});
		await SETTINGS.registerSetting('mainBackground', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Background color',
			description: "Main background color of the panel. (default: Note list background color)"
		});
		await SETTINGS.registerSetting('activeBackground', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active background color',
			description: "Background color of the current active tab. (default: Editor background color)"
		});
		await SETTINGS.registerSetting('mainForeground', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Foreground color',
			description: "Default foreground color used for text and icons. (default: App faded color)"
		});
		await SETTINGS.registerSetting('activeForeground', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Active foreground color',
			description: "Foreground color of the current active tab. (default: Editor font color)"
		});
		await SETTINGS.registerSetting('dividerColor', {
			value: SettingDefaults.Default,
			type: SettingItemType.String,
			section: 'note.tabs.settings',
			public: true,
			advanced: true,
			label: 'Divider color',
			description: "Color of the divider between the tabs. (default: App divider/border color)"
		});

		//#endregion

		//#region INIT LOCAL VARIABLES

		let lastActiveNoteQueue = new LastActiveNoteQueue();
		let tabs = new NoteTabs();
		await tabs.read();

		//#endregion

		//#region COMMAND HELPER FUNCTIONS

		async function getSettingOrDefault(setting: string, defaultValue: string): Promise<string> {
			const value: string = await SETTINGS.value(setting);
			if (value.match(new RegExp(SettingDefaults.Default, "i"))) {
				return defaultValue;
			} else {
				return value;
			}
		}

		/**
		 * Add note as temporary tab, if not already has one.
		 */
		async function addTab(noteId: string) {
			if (tabs.hasTab(noteId)) return;

			if (tabs.indexOfTemp() >= 0) {
				// replace existing temporary tab...
				tabs.replaceTemp(noteId);
			} else {
				// or add as new temporary tab at the end
				await tabs.add(noteId, NoteTabType.Temporary);
			}
		}

		/**
		 * Add new or pin tab for handled note.
		 */
		async function pinTab(note: any, addAsNew: boolean) {
			// do not pin completed todos if auto unpin is enabled
			const unpinCompletedTodos: boolean = await SETTINGS.value('unpinCompletedTodos');
			if (unpinCompletedTodos && note.is_todo && note.todo_completed) return;

			if (tabs.hasTab(note.id)) {
				// if note has already a tab, change type to pinned
				await tabs.changeType(note.id, NoteTabType.Pinned);
			} else {
				// otherwise add as new one at the end
				if (addAsNew) await tabs.add(note.id, NoteTabType.Pinned);
			}
		}

		/**
		 * Remove or unpin note with handled id.
		 */
		async function removeTab(noteId: string) {
			const selectedNote: any = await WORKSPACE.selectedNote();

			// remove tab completely
			await tabs.delete(noteId);

			// if note is the selected note
			if (selectedNote && selectedNote.id == noteId) {
				// add as temp tab or replace existing one
				await addTab(noteId);
			}
		}

		/**
		 * Open the first of the selected notes in order to update the tabs panel.
		 * If none is selected the panel is also updated.
		 */
		async function openNoteOrUpdate() {
			const selectedNoteIds: string[] = await WORKSPACE.selectedNoteIds();

			if (selectedNoteIds.length > 0) {
				await COMMANDS.execute('openNote', selectedNoteIds[0]);
				// updatePanelView() is called from onNoteSelectionChange event
			} else {
				await updatePanelView();
			}
		}

		/**
		 * Toggle state of handled todo.
		 */
		async function toggleTodo(noteId: string, checked: any) {
			try {
				const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
				if (note.is_todo && checked) {
					await DATA.put(['notes', note.id], null, { todo_completed: Date.now() });
				} else {
					await DATA.put(['notes', note.id], null, { todo_completed: 0 });
				}
				// updatePanelView() is called from onNoteChange event
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
				await pinTab(selectedNote, false);
				await updatePanelView();
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
				// pin all handled notes and update panel
				for (const noteId of noteIds) {
					const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
					await pinTab(note, true);
				}
				await openNoteOrUpdate();
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
				await removeTab(selectedNote.id);
				await updatePanelView();
			}
		});

		// Command: tabsMoveLeft
		// Desc: Move active tab to left
		await COMMANDS.register({
			name: 'tabsMoveLeft',
			label: 'Tabs: Move tab left',
			iconName: 'fas fa-chevron-left',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// change index of tab and update panel
				const index: number = tabs.indexOf(selectedNote.id);
				await tabs.moveWithIndex(index, index - 1);
				await updatePanelView();
			}
		});

		// Command: tabsMoveRight
		// Desc: Move active tab to right
		await COMMANDS.register({
			name: 'tabsMoveRight',
			label: 'Tabs: Move tab right',
			iconName: 'fas fa-chevron-right',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// change index of tab and update panel
				const index: number = tabs.indexOf(selectedNote.id);
				await tabs.moveWithIndex(index, index + 1);
				await updatePanelView();
			}
		});

		// Command: tabsSwitchLastActive
		// Desc: Switch to last active tab
		await COMMANDS.register({
			name: 'tabsSwitchLastActive',
			label: 'Tabs: Switch to last active tab',
			iconName: 'fas fa-step-backward',
			enabledCondition: "oneNoteSelected",
			execute: async () => {
				if (lastActiveNoteQueue.length() < 2) return;

				// get the last active note from the queue
				const lastActiveNoteId = lastActiveNoteQueue.pop();

				// select note with stored id
				await COMMANDS.execute('openNote', lastActiveNoteId);
				// updatePanelView() is called from onNoteSelectionChange event
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
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// check if note is not already first, otherwise exit
				const index: number = tabs.indexOf(selectedNote.id);
				if (index <= 0) return;

				// get id of left note and select it
				await COMMANDS.execute('openNote', tabs.get(index - 1).id);
				// updatePanelView() is called from onNoteSelectionChange event
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
				const selectedNote: any = await WORKSPACE.selectedNote();
				if (!selectedNote) return;

				// check if note is not already last, otherwise exit
				const index: number = tabs.indexOf(selectedNote.id);
				if (index < 0) return;
				if (index == tabs.length() - 1) return;

				// get id of right note and select it
				await COMMANDS.execute('openNote', tabs.get(index + 1).id);
				// updatePanelView() is called from onNoteSelectionChange event
			}
		});

		// Command: tabsClear
		// Desc: Remove all pinned tabs
		await COMMANDS.register({
			name: 'tabsClear',
			label: 'Tabs: Remove all pinned tabs',
			iconName: 'fas fa-times',
			execute: async () => {
				// ask user before removing tabs
				const result: number = await DIALOGS.showMessageBox(`Remove all pinned tabs?`);
				if (result) return;

				await tabs.clearAll();
				await openNoteOrUpdate();
			}
		});

		//#endregion

		//#region SETUP PANEL

		// prepare panel object
		const panel = await PANELS.create("note.tabs.panel");
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
				await removeTab(message.id);
				await updatePanelView();
			}
			if (message.name === 'tabsToggleTodo') {
				await toggleTodo(message.id, message.checked);
				// updatePanelView() is called from onNoteChange event
			}
			if (message.name === 'tabsMoveLeft') {
				await COMMANDS.execute('tabsMoveLeft');
			}
			if (message.name === 'tabsMoveRight') {
				await COMMANDS.execute('tabsMoveRight');
			}
			if (message.name === 'tabsDrag') {
				await tabs.moveWithId(message.sourceId, message.targetId);
				await updatePanelView();
			}
		});

		// update HTML content
		async function updatePanelView() {
			const noteTabsHtml: any = [];
			const selectedNote: any = await WORKSPACE.selectedNote();

			// get style values from settings
			const enableDragAndDrop: boolean = await SETTINGS.value('enableDragAndDrop');
			const showCheckboxes: boolean = await SETTINGS.value('showTodoCheckboxes');
			const height: number = await SETTINGS.value('tabHeight');
			const minWidth: number = await SETTINGS.value('minTabWidth');
			const maxWidth: number = await SETTINGS.value('maxTabWidth');
			const font: string = await getSettingOrDefault('fontFamily', SettingDefaults.Font);
			const mainBg: string = await getSettingOrDefault('mainBackground', SettingDefaults.Background);
			const mainFg: string = await getSettingOrDefault('mainForeground', SettingDefaults.Foreground);
			const activeBg: string = await getSettingOrDefault('activeBackground', SettingDefaults.ActiveBackground);
			const activeFg: string = await getSettingOrDefault('activeForeground', SettingDefaults.ActiveForeground);
			const dividerColor: string = await getSettingOrDefault('dividerColor', SettingDefaults.DividerColor);

			// create HTML for each tab
			for (const noteTab of tabs.getAll()) {
				let note: any = null;

				// get real note from database, if no longer exists remove tab and continue with next one
				try {
					note = await DATA.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
				} catch (error) {
					await tabs.delete(noteTab.id);
					continue;
				}

				if (note) {
					// prepare tab style attributes
					const background: string = (selectedNote && note.id == selectedNote.id) ? activeBg : mainBg;
					const foreground: string = (selectedNote && note.id == selectedNote.id) ? activeFg : mainFg;
					const newTab: string = (noteTab.type == NoteTabType.Temporary) ? " new" : "";
					const icon: string = (noteTab.type == NoteTabType.Pinned) ? "fa-times" : "fa-thumbtack";
					const iconTitle: string = (noteTab.type == NoteTabType.Pinned) ? "Unpin" : "Pin";
					const checkbox: string = (showCheckboxes && note.is_todo) ? `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''} data-id="${note.id}">` : '';
					const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

					noteTabsHtml.push(`
						<div id="tab" class="${newTab}" data-id="${note.id}" role="tab"
							draggable="${enableDragAndDrop}" ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event);" ondragleave="dragLeave(event);" ondrop="drop(event);"
							style="height:${height}px;min-width:${minWidth}px;max-width:${maxWidth}px;border-color:${dividerColor};background:${background};">
							<div class="tab-inner" data-id="${note.id}">
								${checkbox}
								<span class="title" data-id="${note.id}" style="color:${foreground};text-decoration: ${textDecoration};">
									${note.title}
								</span>
								<a href="#" id="${iconTitle}" class="fas ${icon}" title="${iconTitle}" data-id="${note.id}" style="color:${foreground};"></a>
							</div>
						</div>
					`);
				}
			}

			// prepare style attributes
			const displayControls: string = (enableDragAndDrop) ? "none" : "flex";

			// add tabs to container and push to panel
			await PANELS.setHtml(panel, `
				<div id="container" style="background:${mainBg};font-family:'${font}',sans-serif;">
					<div id="tabs-container" role="tablist">
						${noteTabsHtml.join('\n')}
						<div id="controls" style="height:${height}px;display:${displayControls};">
							<a href="#" id="moveTabLeft" class="fas fa-chevron-left" title="Move active tab left" style="color:${mainFg};"></a>
							<a href="#" id="moveTabRight" class="fas fa-chevron-right" title="Move active tab right" style="color:${mainFg};"></a>
						</div>
					</div>
				</div>
			`);
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
				commandName: "tabsSwitchLastActive",
				label: 'Switch to last active tab'
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
				label: 'Remove all pinned tabs'
			}
		];
		await joplin.views.menus.create('toolsTabs', 'Tabs', tabsCommandsSubMenu, MenuItemLocation.Tools);

		// add commands to note list context menu
		await joplin.views.menuItems.create('noteListContextMenuPinToTabs', 'tabsPinToTabs', MenuItemLocation.NoteListContextMenu);

		// add commands to editor context menu
		await joplin.views.menuItems.create('editorContextMenuPinNote', 'tabsPinNote', MenuItemLocation.EditorContextMenu);

		//#endregion

		//#region MAP INTERNAL EVENTS

		WORKSPACE.onNoteSelectionChange(async () => {
			try {
				const selectedNote: any = await WORKSPACE.selectedNote();

				if (selectedNote) {
					// add tab for selected note
					await addTab(selectedNote.id);

					// add selected note id to last active queue
					lastActiveNoteQueue.push(selectedNote.id);
				}

				await updatePanelView();
			} catch (error) {
				console.error(`onNoteSelectionChange: ${error}`);
			}
		});

		// ItemChangeEventType { Create = 1, Update = 2, Delete = 3 }
		WORKSPACE.onNoteChange(async (ev: any) => {
			try {
				if (ev) {
					// note was updated (ItemChangeEventType.Update)
					if (ev.event == 2) {
						// console.log(`onNoteChange: note '${ev.id}' was updated`);

						// get handled note and return if null
						const note: any = await DATA.get(['notes', ev.id], { fields: ['id', 'is_todo', 'todo_completed'] });
						if (note == null) return;

						// if auto pin is enabled and handled, pin to tabs
						const pinEditedNotes: boolean = await SETTINGS.value('pinEditedNotes');
						if (pinEditedNotes) {
							await pinTab(note, false);
						}

						// if auto unpin is enabled and handled note is a completed todo...
						const unpinCompletedTodos: boolean = await SETTINGS.value('unpinCompletedTodos');
						if (unpinCompletedTodos && note.is_todo && note.todo_completed) {
							await removeTab(note.id);
						}
					}

					// note was deleted (ItemChangeEventType.Delete)
					if (ev.event == 3) {
						// console.log(`onNoteChange: note '${ev.id}' was deleted`);

						// if note was deleted, remove tab
						await tabs.delete(ev.id);
					}
				}

				await updatePanelView();
			} catch (error) {
				console.error(`onNoteChange: ${error}`);
			}
		});

		WORKSPACE.onSyncComplete(async () => {
			await updatePanelView();
		});

		//#endregion

		await updatePanelView();
	},
});
