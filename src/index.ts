import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { NoteTabType, NoteTabs } from './noteTabs';
import { LastActiveNote } from './lastActiveNote';
import { Settings } from './settings';

joplin.plugins.register({
  onStart: async function () {
    const COMMANDS = joplin.commands;
    const DATA = joplin.data;
    const DIALOGS = joplin.views.dialogs;
    const PANELS = joplin.views.panels;
    const SETTINGS = joplin.settings;
    const WORKSPACE = joplin.workspace;

    const settings: Settings = new Settings();
    await settings.register();

    const tabs = new NoteTabs(settings.noteTabs);
    const lastActiveNote = new LastActiveNote();

    //#region HELPERS

    /**
     * Add note as temporary tab, if not already has one.
     */
    async function addTab(noteId: string) {
      if (tabs.hasTab(noteId)) return;

      if (tabs.indexOfTemp >= 0) {
        // replace existing temporary tab...
        tabs.replaceTemp(noteId);
      } else {
        // or add as new temporary tab at the end
        await tabs.add(noteId, NoteTabType.Temporary);
      }
    }

    /**
     * Add new or pin tab for handled note. Optionally at the specified index of targetId.
     */
    async function pinTab(note: any, addAsNew: boolean, targetId?: string) {
      // do not pin completed todos if auto unpin is enabled
      if (settings.unpinCompletedTodos && note.is_todo && note.todo_completed) return;

      if (tabs.hasTab(note.id)) {
        // if note has already a tab, change type to pinned
        await tabs.changeType(note.id, NoteTabType.Pinned);
      } else {
        // otherwise add as new one
        if (addAsNew) await tabs.add(note.id, NoteTabType.Pinned, targetId);
      }
    }

    /**
     * Add all handled note ids as pinned tabs. Optionally at the specified index of targetId.
     */
    async function pinNoteIds(noteIds: any[], targetId?: string) {
      for (const noteId of noteIds) {
        try {
          const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
          if (note) {
            pinTab(note, true, targetId);
          }
        } catch (error) {
          return;
        }
      }
    }

    /**
     * Remove or unpin note with handled id.
     */
    async function removeTab(noteId: string) {
      const selectedNote: any = await WORKSPACE.selectedNote();

      // remove tab completely
      await tabs.delete(noteId);

      // if note is the selected note, add as temp tab or replace existing one
      if (selectedNote && selectedNote.id == noteId) {
        await addTab(noteId);
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

    /**
     * Gets an array of all parents starting from the handled parent_id.
     * Consider first entry is handled parent.
     */
    async function getNoteParents(parent_id: string): Promise<any[]> {
      const parents: any[] = new Array();
      let last_id: string = parent_id;

      while (last_id) {
        const parent: any = await DATA.get(['folders', last_id], { fields: ['id', 'title', 'parent_id'] });
        if (!parent) break;
        last_id = parent.parent_id;
        parents.push(parent);
      }
      return parents;
    }

    //#endregion

    //#region COMMANDS

    // Command: tabsPinNote
    // Desc: Pin the selected note(s) to the tabs
    await COMMANDS.register({
      name: 'tabsPinNote',
      label: 'Tabs: Pin note',
      iconName: 'fas fa-thumbtack',
      enabledCondition: "someNotesSelected",
      execute: async (noteIds: string[]) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // pin all handled notes and update panel
        await pinNoteIds(selectedNoteIds);
        await updatePanelView();
      }
    });

    // Command: tabsUnpinNote
    // Desc: Unpin the selected note(s) from the tabs
    await COMMANDS.register({
      name: 'tabsUnpinNote',
      label: 'Tabs: Unpin note',
      iconName: 'fas fa-times',
      enabledCondition: "someNotesSelected",
      execute: async (noteIds: string[]) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // unpin selected notes and update panel
        for (const noteId of selectedNoteIds) {
          await removeTab(noteId);
        }
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
        if (lastActiveNote.length < 2) return;

        // get the last active note from the queue
        const lastActiveNoteId = lastActiveNote.id;

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
        if (index == tabs.length - 1) return;

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

        // open selected note to update the panel or just update it
        const selectedNoteIds: string[] = await WORKSPACE.selectedNoteIds();
        if (selectedNoteIds.length > 0) {
          await COMMANDS.execute('openNote', selectedNoteIds[0]);
          // updatePanelView() is called from onNoteSelectionChange event
        } else {
          await updatePanelView();
        }
      }
    });

    // Command: tabsToggleVisibility
    // Desc: Toggle panel visibility
    await COMMANDS.register({
      name: 'tabsToggleVisibility',
      label: 'Tabs: Toggle visibility',
      iconName: 'fas fa-eye-slash',
      execute: async () => {
        const isVisible: boolean = await PANELS.visible(panel);
        await PANELS.show(panel, (!isVisible));
      }
    });

    // prepare commands menu
    const commandsSubMenu: MenuItem[] = [
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
      },
      {
        commandName: "tabsToggleVisibility",
        label: 'Toggle panel visibility'
      }
    ];
    await joplin.views.menus.create('toolsTabs', 'Tabs', commandsSubMenu, MenuItemLocation.Tools);

    // add commands to notes context menu
    await joplin.views.menuItems.create('notesContextMenuPinToTabs', 'tabsPinNote', MenuItemLocation.NoteListContextMenu);

    // add commands to editor context menu
    await joplin.views.menuItems.create('editorContextMenuPinNote', 'tabsPinNote', MenuItemLocation.EditorContextMenu);

    //#endregion

    //#region DIALOGS

    //#endregion

    //#region PANELS

    // prepare panel object
    const panel = await PANELS.create('note.tabs.panel');
    await PANELS.addScript(panel, './assets/fontawesome/css/all.min.css');
    await PANELS.addScript(panel, './webview.css');
    await PANELS.addScript(panel, './webview.js');
    await PANELS.onMessage(panel, async (message: any) => {
      if (message.name === 'tabsOpenFolder') {
        await COMMANDS.execute('openFolder', message.id);
      }
      if (message.name === 'tabsOpen') {
        await COMMANDS.execute('openNote', message.id);
      }
      if (message.name === 'tabsPinNote') {
        let id: string[] = [message.id];
        await COMMANDS.execute('tabsPinNote', id);
      }
      if (message.name === 'tabsUnpinNote') {
        let id: string[] = [message.id];
        await COMMANDS.execute('tabsUnpinNote', id);
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
      if (message.name === 'tabsBack') {
        await COMMANDS.execute('historyBackward');
      }
      if (message.name === 'tabsForward') {
        await COMMANDS.execute('historyForward');
      }
      if (message.name === 'tabsDrag') {
        await tabs.moveWithId(message.sourceId, message.targetId);
        await updatePanelView();
      }
      if (message.name === 'tabsDragNotes') {
        await pinNoteIds(message.noteIds, message.targetId);
        await updatePanelView();
      }
    });

    // set init message
    await PANELS.setHtml(panel, `
      <div id="container" style="background:${settings.background};font-family:'${settings.fontFamily}',sans-serif;font-size:${settings.fontSize};">
        <div id="tabs-container">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);

    // update HTML content
    async function updatePanelView() {
      const noteTabsHtml: any = [];
      const selectedNote: any = await WORKSPACE.selectedNote();

      // get global settings
      const showCompletedTodos: boolean = await SETTINGS.globalValue('showCompletedTodos');

      // create HTML for each tab
      for (const noteTab of tabs.all) {
        let note: any = null;

        // get real note from database, if no longer exists remove tab and continue with next one
        try {
          note = await DATA.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
        } catch (error) {
          await tabs.delete(noteTab.id);
          continue;
        }

        if (note) {
          // continue with next tab if completed todos shall not be shown
          if ((!showCompletedTodos) && note.todo_completed) continue;

          // prepare tab style attributes
          const bg: string = (selectedNote && note.id == selectedNote.id) ? settings.actBackground : settings.background;
          const fg: string = (selectedNote && note.id == selectedNote.id) ? settings.actForeground : settings.foreground;
          const newTab: string = (noteTab.type == NoteTabType.Temporary) ? ' new' : '';
          const icon: string = (noteTab.type == NoteTabType.Pinned) ? 'fa-times' : 'fa-thumbtack';
          const iconTitle: string = (noteTab.type == NoteTabType.Pinned) ? 'Unpin' : 'Pin';
          const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

          // prepare checkbox for todo
          let checkboxHtml: string = '';
          if (settings.showTodoCheckboxes && note.is_todo)
            checkboxHtml = `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''}>`;

          noteTabsHtml.push(`
            <div id="tab" data-id="${note.id}" data-bg="${bg}" draggable="${settings.enableDragAndDrop}" class="${newTab}" role="tab" title="${note.title}"
              onclick="tabClick(event);" ondblclick="pinNote(event);" onmouseover="setBackground(event,'${settings.hoverBackground}');" onmouseout="resetBackground(this);"
              ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event, '${settings.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);"
              style="height:${settings.tabHeight}px;min-width:${settings.minTabWidth}px;max-width:${settings.maxTabWidth}px;border-color:${settings.dividerColor};background:${bg};">
              <span class="tab-inner">
                ${checkboxHtml}
                <span class="tab-title" style="color:${fg};text-decoration: ${textDecoration};">
                  ${note.title}
                </span>
                <a href="#" id="${iconTitle}" class="fas ${icon}" title="${iconTitle}" style="color:${fg};"></a>
              </span>
            </div>
          `);
        }
      }

      // prepare control buttons, if drag&drop is disabled
      let controlsHtml: string = '';
      if (!settings.enableDragAndDrop) {
        controlsHtml = `
          <div id="controls" style="height:${settings.tabHeight}px;">
            <a href="#" class="fas fa-chevron-left" title="Move active tab left" style="color:${settings.foreground};" onclick="message('tabsMoveLeft');"></a>
            <a href="#" class="fas fa-chevron-right" title="Move active tab right" style="color:${settings.foreground};" onclick="message('tabsMoveRight');"></a>
          </div>
        `;
      }

      // prepare navigation buttons, if enabled
      let navigationHtml: string = '';
      if (settings.showNavigationButtons && selectedNote) {
        navigationHtml = `
          <div class="navigation-icons" style="border-color:${settings.dividerColor};">
            <a href="#" class="fas fa-chevron-left" title="Back" style="color:${settings.foreground};" onclick="message('tabsBack');"></a>
            <a href="#" class="fas fa-chevron-right" title="Forward" style="color:${settings.foreground};" onclick="message('tabsForward');"></a>
          </div>
        `;
      }

      // prepare breadcrumbs, if enabled
      let breadcrumbsHtml: string = '';
      if (settings.showBreadcrumbs && selectedNote) {
        let parentsHtml: any[] = new Array();
        let parents: any[] = await getNoteParents(selectedNote.parent_id);

        // collect all parent folders and prepare html container for each
        while (parents) {
          const parent: any = parents.pop();
          if (!parent) break;

          parentsHtml.push(`
            <div class="breadcrumb" data-id="${parent.id}" onClick="openFolder(event);"
              style="min-width:${settings.breadcrumbsMinWidth}px;max-width:${settings.breadcrumbsMaxWidth}px;">
              <span class="breadcrumb-inner">
                <a href="#" class="breadcrumb-title" style="color:${settings.foreground};" title="${parent.title}">${parent.title}</a>
                <span class="fas fa-chevron-right" style="color:${settings.foreground};"></span>
              </span>
            </div>
          `);
        }

        // setup breadcrumbs container html
        breadcrumbsHtml = `
          <div id="breadcrumbs-container" style="background:${settings.breadcrumbsBackground};">
            ${navigationHtml}
            <div class="breadcrumbs-icon">
              <span class="fas fa-book" style="color:${settings.foreground};"></span>
            </div>
            ${parentsHtml.join(`\n`)}
          </div>
        `;
      }

      // add entries to container and push to panel
      await PANELS.setHtml(panel, `
        <div id="container" style="background:${settings.background};font-family:'${settings.fontFamily}',sans-serif;font-size:${settings.fontSize};">
          <div id="tabs-container" role="tablist" draggable="${settings.enableDragAndDrop}"
            ondragend="dragEnd(event);" ondragover="dragOver(event, '${settings.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);">
            ${noteTabsHtml.join('\n')}
            ${controlsHtml}
          </div>
          ${breadcrumbsHtml}
        </div>
      `);

      // store the current note tabs array back to the settings
      // - Currently there's no "event" to call store() only on App closing
      // - Which would be preferred
      settings.storeTabs(tabs.all);
    }

    //#endregion

    //#region EVENTS

    SETTINGS.onChange(async (event: ChangeEvent) => {
      await settings.read(event);
      await updatePanelView();
    });

    WORKSPACE.onNoteSelectionChange(async () => {
      try {
        const selectedNote: any = await WORKSPACE.selectedNote();

        if (selectedNote) {
          // add tab for selected note
          await addTab(selectedNote.id);

          // add selected note id to last active queue
          lastActiveNote.id = selectedNote.id;
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

            // get handled note and return if null
            const note: any = await DATA.get(['notes', ev.id], { fields: ['id', 'is_todo', 'todo_completed'] });
            if (note == null) return;

            // if auto pin is enabled and handled, pin to tabs
            if (settings.pinEditedNotes)
              await pinTab(note, false);

            // if auto unpin is enabled and handled note is a completed todo...
            if (settings.unpinCompletedTodos && note.is_todo && note.todo_completed)
              await removeTab(note.id);
          }

          // note was deleted (ItemChangeEventType.Delete) - remove tab
          if (ev.event == 3) {
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
  }
});
