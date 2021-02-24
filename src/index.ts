import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { NoteTabType, NoteTabs } from './noteTabs';
import { LastActiveNote } from './lastActiveNote';
import { Settings } from './settings';
import { Panel } from './panel';

joplin.plugins.register({
  onStart: async function () {
    const COMMANDS = joplin.commands;
    const DATA = joplin.data;
    const DIALOGS = joplin.views.dialogs;
    const SETTINGS = joplin.settings;
    const WORKSPACE = joplin.workspace;
    // settings
    const settings: Settings = new Settings();
    await settings.register();
    // note tabs
    const tabs = new NoteTabs(settings);
    // last active note
    const lastActiveNote = new LastActiveNote();
    // panel
    const panel = new Panel(tabs, settings);
    await panel.register();

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

    //#endregion

    //#region COMMANDS

    // Command: tabsPinNote
    // Desc: Pin the selected note(s) to the tabs
    await COMMANDS.register({
      name: 'tabsPinNote',
      label: 'Tabs: Pin note',
      iconName: 'fas fa-thumbtack',
      enabledCondition: 'someNotesSelected',
      execute: async (noteIds: string[], targetId?: string) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // Add all handled note ids as pinned tabs. Optionally at the specified index of targetId.
        for (const noteId of selectedNoteIds) {
          try {
            const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
            if (note) {
              pinTab(note, true, targetId);
            }
          } catch (error) {
            continue;
          }
        }
        await panel.updateWebview();
      }
    });

    // Command: tabsUnpinNote
    // Desc: Unpin the selected note(s) from the tabs
    await COMMANDS.register({
      name: 'tabsUnpinNote',
      label: 'Tabs: Unpin note',
      iconName: 'fas fa-times',
      enabledCondition: 'someNotesSelected',
      execute: async (noteIds: string[]) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // unpin selected notes and update panel
        for (const noteId of selectedNoteIds) {
          await removeTab(noteId);
        }
        await panel.updateWebview();
      }
    });

    // Command: tabsMoveLeft
    // Desc: Move active tab to left
    await COMMANDS.register({
      name: 'tabsMoveLeft',
      label: 'Tabs: Move tab left',
      iconName: 'fas fa-chevron-left',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        // change index of tab and update panel
        const index: number = tabs.indexOf(selectedNote.id);
        await tabs.moveWithIndex(index, index - 1);
        await panel.updateWebview();
      }
    });

    // Command: tabsMoveRight
    // Desc: Move active tab to right
    await COMMANDS.register({
      name: 'tabsMoveRight',
      label: 'Tabs: Move tab right',
      iconName: 'fas fa-chevron-right',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        // change index of tab and update panel
        const index: number = tabs.indexOf(selectedNote.id);
        await tabs.moveWithIndex(index, index + 1);
        await panel.updateWebview();
      }
    });

    // Command: tabsSwitchLastActive
    // Desc: Switch to last active tab
    await COMMANDS.register({
      name: 'tabsSwitchLastActive',
      label: 'Tabs: Switch to last active tab',
      iconName: 'fas fa-step-backward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        if (lastActiveNote.length < 2) return;

        // get the last active note from the queue
        const lastActiveNoteId = lastActiveNote.id;

        // select note with stored id
        await COMMANDS.execute('openNote', lastActiveNoteId);
        // updateWebview() is called from onNoteSelectionChange event
      }
    });

    // Command: tabsSwitchLeft
    // Desc: Switch to left tab, i.e. select left note
    await COMMANDS.register({
      name: 'tabsSwitchLeft',
      label: 'Tabs: Switch to left tab',
      iconName: 'fas fa-step-backward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        // check if note is not already first, otherwise exit
        const index: number = tabs.indexOf(selectedNote.id);
        if (index <= 0) return;

        // get id of left note and select it
        await COMMANDS.execute('openNote', tabs.get(index - 1).id);
        // updateWebview() is called from onNoteSelectionChange event
      }
    });

    // Command: tabsSwitchRight
    // Desc: Switch to right tab, i.e. select right note
    await COMMANDS.register({
      name: 'tabsSwitchRight',
      label: 'Tabs: Switch to right tab',
      iconName: 'fas fa-step-forward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        // check if note is not already last, otherwise exit
        const index: number = tabs.indexOf(selectedNote.id);
        if (index < 0) return;
        if (index == tabs.length - 1) return;

        // get id of right note and select it
        await COMMANDS.execute('openNote', tabs.get(index + 1).id);
        // updateWebview() is called from onNoteSelectionChange event
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
        const result: number = await DIALOGS.showMessageBox('Do you really want to remove all pinned tabs?');
        if (result) return;

        await settings.clearTabs();

        // open selected note to update the panel or just update it
        const selectedNoteIds: string[] = await WORKSPACE.selectedNoteIds();
        if (selectedNoteIds.length > 0) {
          await COMMANDS.execute('openNote', selectedNoteIds[0]);
          // updateWebview() is called from onNoteSelectionChange event
        } else {
          await panel.updateWebview();
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
        await panel.toggleVisibility();
      }
    });

    // prepare commands menu
    const commandsSubMenu: MenuItem[] = [
      {
        commandName: 'tabsPinNote',
        label: 'Pin note'
      },
      {
        commandName: 'tabsUnpinNote',
        label: 'Unpin note'
      },
      {
        commandName: 'tabsSwitchLastActive',
        label: 'Switch to last active tab'
      },
      {
        commandName: 'tabsSwitchLeft',
        label: 'Switch to left tab'
      },
      {
        commandName: 'tabsSwitchRight',
        label: 'Switch to right tab'
      },
      {
        commandName: 'tabsMoveLeft',
        label: 'Move tab left'
      },
      {
        commandName: 'tabsMoveRight',
        label: 'Move tab right'
      },
      {
        commandName: 'tabsClear',
        label: 'Remove all pinned tabs'
      },
      {
        commandName: 'tabsToggleVisibility',
        label: 'Toggle panel visibility'
      }
    ];
    await joplin.views.menus.create('toolsTabs', 'Tabs', commandsSubMenu, MenuItemLocation.Tools);

    // add commands to notes context menu
    await joplin.views.menuItems.create('notesContextMenuPinToTabs', 'tabsPinNote', MenuItemLocation.NoteListContextMenu);

    // add commands to editor context menu
    await joplin.views.menuItems.create('editorContextMenuPinNote', 'tabsPinNote', MenuItemLocation.EditorContextMenu);

    //#endregion

    //#region EVENTS

    // let onChangeCnt = 0;
    SETTINGS.onChange(async (event: ChangeEvent) => {
      // console.debug(`onChange() hits: ${onChangeCnt++}`);
      await settings.read(event);
      await panel.updateWebview();
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

        await panel.updateWebview();
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

        await panel.updateWebview();
      } catch (error) {
        console.error(`onNoteChange: ${error}`);
      }
    });

    WORKSPACE.onSyncComplete(async () => {
      await panel.updateWebview();
    });

    //#endregion

    await panel.updateWebview();
  }
});
