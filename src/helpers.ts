import joplin from 'api';
import { target } from 'webpack.config';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
export enum SettingDefaults {
  Default = 'default',
  Font = 'Roboto',
  Background = 'var(--joplin-background-color3)',
  Foreground = 'var(--joplin-color-faded)',
  ActiveBackground = 'var(--joplin-background-color)',
  ActiveForeground = 'var(--joplin-color)',
  DividerColor = 'var(--joplin-divider-color)'
}

/**
 * Tab type definition.
 * Open state is currently not used.
 */
export enum NoteTabType {
  Temporary = 1,
  Open = 2,
  Pinned = 3
}

/**
 * Storage of note tabs.
 */
export class NoteTabs {
  // [
  //   {
  //     "id": "note id",
  //     "type": NoteTabType
  //   }
  // ]
  private _tabs: any[];

  constructor() {
    this._tabs = new Array();
  }

  /**
   * Reads the noteTabs settings array.
   */
  async read() {
    this._tabs = await joplin.settings.value('noteTabs');
  }

  /**
   * Writes the temporay tabs store back to the settings array.
   */
  private async store() {
    await joplin.settings.setValue('noteTabs', this._tabs);
  }

  /**
   * Gets the number of tabs.
   */
  length(): number {
    return this._tabs.length;
  }

  /**
   * Gets all tabs.
   */
  getAll(): any[] {
    return this._tabs;
  }

  /**
   * Gets the tab for the handled note.
   */
  get(index: number): any {
    if (index < 0 || index >= this.length()) return;

    return this._tabs[index];
  }

  /**
   * Gets index of tab for note with handled id.
   */
  indexOf(noteId: string): number {
    if (noteId == null) return;

    for (let i: number = 0; i < this.length(); i += 1) {
      if (this._tabs[i]['id'] === noteId) return i;
    }
    return -1;
  }

  /**
   * Gets a value whether the handled note has already a tab or not.
   */
  hasTab(noteId: string): boolean {
    if (noteId == null) return;

    return this.indexOf(noteId) < 0 ? false : true;
  }

  /**
   * Adds note as new tab at the end.
   */
  async add(noteId: string, noteType: NoteTabType) {
    if (noteId == null) return;

    this._tabs.push({ id: noteId, type: noteType });
    await this.store();
  }

  async pin(noteId: string) {
    if (this.hasTab(noteId)) {
      // TODO consider if auto unpin is enabled - do not add completed todos
      // if note has already a tab, change type to pinned
      await this.changeType(noteId, NoteTabType.Pinned);
    } else {
      // otherwise add as new one at the end
      await this.add(noteId, NoteTabType.Pinned);
    }
  }

  /**
   * Moves the tab on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (sourceIdx < 0 || sourceIdx >= this.length()) return;
    if (targetIdx < 0 || targetIdx >= this.length()) return;

    // console.log(`moveWithIndex: ${sourceIdx} to ${targetIdx} with length = ${this.length()}`);

    const tab: any = this._tabs[sourceIdx];
    await this.delete(sourceIdx);
    await this.insertAtIndex((targetIdx == 0 ? 0 : targetIdx), tab);
    await this.store();
  }

  /**
   * Moves the tab of source note to the index of the target note.
   */
  async moveWithId(sourceId: string, targetId: string) {
    if (targetId == null || sourceId == null) return;

    await this.moveWithIndex(this.indexOf(sourceId), this.indexOf(targetId));
  }

  /**
    * Changes type of the tab for the handled note.
    */
  async changeType(noteId: string, newType: NoteTabType) {
    if (!this.hasTab(noteId)) return;

    this._tabs[this.indexOf(noteId)].type = newType;
    await this.store();
  }

  /**
   * Removes tab on handled index.
   */
  async delete(index: number) {
    // TODO rework to get noteId instead of index
    if (index < 0) return;

    this._tabs.splice(index, 1);
    await this.store();
  }

  /**
   * Inserts handled tab at specified index.
   */
  async insertAtIndex(index: number, tab: any) {
    if (index < 0 || tab == null) return;

    this._tabs.splice(index, 0, tab);
    await this.store();
  }

  /**
   * Replaces tab at specified index with handled one.
   */
  async replaceAtIndex(index: number, tab: any) {
    if (index < 0 || tab == null) return;

    this._tabs.splice(index, 1, tab);
    await this.store();
  }

  /**
   * Clears the stored tabs array.
   */
  async clearAll() {
    this._tabs = [];
    await this.store();
  }
}

/**
 * Queue to store last active note id.
 * Contains maximum two entries - current (index=1) and last active (index=0).
 */
export class LastActiveNoteQueue {
  // stores the ids of the notes
  private _store: string[] = new Array();

  push(id: string) {
    // if already two entries exist - remove first one
    if (this._store.length == 2) {
      // return if id is already second entry
      if (this._store[1] == id) return;

      this._store.shift();
    }
    // add handled note id at last
    this._store.push(id);

    // console.log(`push: ${JSON.stringify(this._store)}`);
  }

  pop(): string | undefined {
    return this._store.shift();
  }

  length(): number {
    return this._store.length;
  }
}
