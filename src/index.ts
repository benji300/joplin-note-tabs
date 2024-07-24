import joplin from 'api';
import { MenuItem, MenuItemLocation } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';
import { NoteTabType, NoteTabs } from './noteTabs';
import { LastActiveNote } from './lastActiveNote';
import { Settings, UnpinBehavior, AddBehavior } from './settings';
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
     * Add note as tab, if not already has one.
     */
    async function addTab(noteId: string) {
      if (tabs.hasTab(noteId)) return;

      // depending on settings - either add directly as pinned tab
      const addAsPinned: boolean = settings.hasAddBehavior(AddBehavior.Pinned);
      if (addAsPinned) {
        await pinTab(noteId, true);
      } else {
        // or as temporay tab
        if (tabs.indexOfTemp >= 0) {
          // replace existing temporary tab...
          tabs.replaceTemp(noteId);
        } else {
          // or add as new temporary tab at the end
          await tabs.add(noteId, NoteTabType.Temporary);
        }
      }
    }

    /**
     * Add new or pin tab for handled note. Optionally at the specified index of targetId.
     */
    async function pinTab(noteId: string, addAsNew: boolean, targetId?: string) {
      const note: any = await DATA.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });

      if (note) {
        // do not pin completed todos if auto unpin is enabled
        if (settings.unpinCompletedTodos && note.is_todo && note.todo_completed) return;

        if (tabs.hasTab(note.id)) {
          // if note has already a tab, change type to pinned
          await tabs.changeType(note.id, NoteTabType.Pinned);
        } else {
          // otherwise add as new one
          if (addAsNew) {
            await tabs.add(note.id, NoteTabType.Pinned, targetId);
          }
        }
      }
    }

    /**
     * Open last active note (tab) (if still exists).
     */
    async function openLastActiveNote(): Promise<boolean> {
      if (lastActiveNote.length < 2) return false;

      const lastActiveNoteId = lastActiveNote.id;
      // return if an already closed tab is about to be restored
      if (tabs.indexOf(lastActiveNoteId) < 0) return false;

      await COMMANDS.execute('openNote', lastActiveNoteId);
      return true;
    }

    /**
     * Switch to left tab.
     */
    async function switchTabLeft(noteId: string): Promise<boolean> {
      const index: number = tabs.indexOf(noteId);
      if (index <= 0) return false;

      await COMMANDS.execute('openNote', tabs.get(index - 1).id);
      return true;
    }

    /**
     * Switch to right tab.
     */
    async function switchTabRight(noteId: string): Promise<boolean> {
      const index: number = tabs.indexOf(noteId);
      if (index < 0) return false;
      if (index == tabs.length - 1) return false;

      await COMMANDS.execute('openNote', tabs.get(index + 1).id);
      return true;
    }

    /**
     * Close or unpin note with handled id.
     */
    async function closeTab(noteId: string) {
      const selectedNote: any = await WORKSPACE.selectedNote();

      // if noteId is the selected note - try to select another note depending on the settings
      if (selectedNote && selectedNote.id == noteId) {
        let selected: boolean = false;

        // try to select the appropriate tab
        switch (settings.unpinBehavior) {
          case UnpinBehavior.LastActive:
            selected = await openLastActiveNote();
            if (selected) break;
          // fallthrough if no last active found
          case UnpinBehavior.LeftTab:
            selected = await switchTabLeft(noteId);
            if (selected) break;
          // fallthrough if no right tab found
          case UnpinBehavior.RightTab:
            selected = await switchTabRight(noteId);
            if (selected) break;
            // try to select left tab
            selected = await switchTabLeft(noteId);
          default:
            break;
        }

        // then delete note from tabs
        await tabs.delete(noteId);

        // if no one was selected before
        if (!selected) {
          // re-add deleted note as tab at the end
          await addTab(noteId);
        }
      } else {

        // else simply delete note from tabs
        await tabs.delete(noteId);
      }
    }

    //#endregion

    //#region COMMANDS

    // Command: tabsPinNote
    // Desc: Pin the selected note(s) to the tabs
    await COMMANDS.register({
      name: 'tabsPinNote',
      label: 'Pin note to Tabs',
      iconName: 'fas fa-thumbtack',
      enabledCondition: 'someNotesSelected',
      execute: async (noteIds: string[], targetId?: string) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // add all handled notes as pinned tabs. Optionally at the specified index of targetId.
        for (const noteId of selectedNoteIds) {
          await pinTab(noteId, true, targetId);
        }
        await panel.updateWebview();
      }
    });

    // Command: tabsUnpinNote
    // Desc: Unpin the selected note(s) from the tabs
    await COMMANDS.register({
      name: 'tabsUnpinNote',
      label: 'Unpin note from Tabs',
      iconName: 'fas fa-times',
      enabledCondition: 'someNotesSelected',
      execute: async (noteIds: string[]) => {
        // get selected note ids and return if empty
        let selectedNoteIds = noteIds;
        if (!selectedNoteIds) selectedNoteIds = await WORKSPACE.selectedNoteIds();
        if (!selectedNoteIds) return;

        // unpin selected notes and update panel
        for (const noteId of selectedNoteIds) {
          await closeTab(noteId);
        }
        await panel.updateWebview();
      }
    });

    // Command: tabsMoveLeft
    // Desc: Move active tab to left
    await COMMANDS.register({
      name: 'tabsMoveLeft',
      label: 'Move active Tab left',
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
      label: 'Move active Tab right',
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
      label: 'Switch to last active Tab',
      iconName: 'fas fa-step-backward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        await openLastActiveNote();
        // updateWebview() is called from onNoteSelectionChange event
      }
    });

    // Command: tabsSwitchLeft
    // Desc: Switch to left tab, i.e. select left note
    await COMMANDS.register({
      name: 'tabsSwitchLeft',
      label: 'Switch to left Tab',
      iconName: 'fas fa-step-backward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        await switchTabLeft(selectedNote.id);
        // updateWebview() is called from onNoteSelectionChange event
      }
    });

    // Command: tabsSwitchRight
    // Desc: Switch to right tab, i.e. select right note
    await COMMANDS.register({
      name: 'tabsSwitchRight',
      label: 'Switch to right Tab',
      iconName: 'fas fa-step-forward',
      enabledCondition: 'oneNoteSelected',
      execute: async () => {
        const selectedNote: any = await WORKSPACE.selectedNote();
        if (!selectedNote) return;

        await switchTabRight(selectedNote.id);
        // updateWebview() is called from onNoteSelectionChange event
      }
    });

    // Command: tabsClear
    // Desc: Close all pinned tabs
    await COMMANDS.register({
      name: 'tabsClear',
      label: 'Close all pinned Tabs',
      iconName: 'fas fa-times',
      execute: async () => {
        // ask user before removing tabs
        const result: number = await DIALOGS.showMessageBox('Do you really want to close all pinned tabs?');
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
      label: 'Toggle Tabs visibility',
      iconName: 'fas fa-eye-slash',
      execute: async () => {
        await panel.toggleVisibility();
      }
    });

    // prepare commands menu
    const commandsSubMenu: MenuItem[] = [
      {
        commandName: 'tabsPinNote',
        label: 'Pin note to Tabs'
      },
      {
        commandName: 'tabsUnpinNote',
        label: 'Unpin note from Tabs'
      },
      {
        commandName: 'tabsSwitchLastActive',
        label: 'Switch to last active Tab'
      },
      {
        commandName: 'tabsSwitchLeft',
        label: 'Switch to left Tab'
      },
      {
        commandName: 'tabsSwitchRight',
        label: 'Switch to right Tab'
      },
      {
        commandName: 'tabsMoveLeft',
        label: 'Move active Tab left'
      },
      {
        commandName: 'tabsMoveRight',
        label: 'Move active Tab right'
      },
      {
        commandName: 'tabsClear',
        label: 'Close all pinned Tabs'
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
          // note was changed (ItemChangeEventType.Update)
          if (ev.event == 2) {

            // get changed note and return if null
            const note: any = await DATA.get(['notes', ev.id], { fields: ['id', 'is_todo', 'todo_completed'] });
            if (note == null) return;

            // if auto pin is enabled, pin changed note to tabs
            if (settings.pinEditedNotes) {
              await pinTab(note.id, false);
            }

            // if auto unpin is enabled and changed note is a completed todo...
            if (settings.unpinCompletedTodos && note.is_todo && note.todo_completed) {
              const index: number = tabs.indexOf(note.id);
              // and the note is currently pinned...
              if (tabs.indexOfTemp != index) {
                // then close its tab
                await closeTab(note.id);
              }
            }
          }

          // note was deleted (ItemChangeEventType.Delete) - delete tab
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
