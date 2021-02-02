import joplin from 'api';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
export enum SettingDefaults {
  Default = 'default',
  FontFamily = 'Roboto',
  FontSize = 'var(--joplin-font-size)',
  Background = 'var(--joplin-background-color3)',
  HoverBackground = 'var(--joplin-background-color-hover3)', // var(--joplin-background-hover)
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
 * Helper class to work with note tabs array.
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
   * Inserts handled tab at specified index.
   */
  private async insertAtIndex(index: number, tab: any) {
    if (index < 0 || tab === undefined) return;

    this._tabs.splice(index, 0, tab);
    await this.store();
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
   * Gets index of tab for note with handled id. -1 if not exist.
   */
  indexOf(noteId: string): number {
    return this._tabs.findIndex(x => x.id === noteId);
  }

  /**
   * Gets index of the temporary tab. -1 if not exist.
   */
  indexOfTemp(): number {
    return this._tabs.findIndex(x => x.type === NoteTabType.Temporary);
  }

  /**
   * Gets a value whether the handled note has already a tab or not.
   */
  hasTab(noteId: string): boolean {
    return (this._tabs.find(x => x.id === noteId) !== undefined);
  }

  /**
   * Adds note as new tab at the end.
   */
  async add(noteId: string, noteType: NoteTabType, targetId?: string) {
    if (noteId === undefined || noteType === undefined) return;

    const newTab: any = { id: noteId, type: noteType };
    if (targetId)
      await this.insertAtIndex(this.indexOf(targetId), newTab);
    else
      this._tabs.push(newTab);
    await this.store();
  }

  /**
   * Moves the tab on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (sourceIdx < 0 || sourceIdx >= this.length()) return;
    if (targetIdx < 0 || targetIdx >= this.length()) return;

    const tab: any = this._tabs[sourceIdx];
    await this.delete(this.get(sourceIdx).id);
    await this.insertAtIndex((targetIdx == 0 ? 0 : targetIdx), tab);
    await this.store();
  }

  /**
   * Moves the tab of source note to the index of the target note.
   */
  async moveWithId(sourceId: string, targetId: string) {
    const targetIdx: number = (targetId) ? this.indexOf(targetId) : (this.length() - 1);
    await this.moveWithIndex(this.indexOf(sourceId), targetIdx);
  }

  /**
    * Changes type of the tab for the handled note.
    */
  async changeType(noteId: string, newType: NoteTabType) {
    const index = this.indexOf(noteId);
    if (index >= 0) {
      this._tabs[index].type = newType;
      await this.store();
    }
  }

  /**
   * Replaces tab at specified index with handled one.
   */
  async replaceTemp(noteId: string) {
    if (noteId === undefined) return;

    const tempIdx: number = this.indexOfTemp();
    if (tempIdx >= 0) {
      this._tabs[tempIdx].id = noteId;
      await this.store();
    }
  }

  /**
   * Removes tab on handled index.
   */
  async delete(noteId: string) {
    const index = this.indexOf(noteId);
    if (index >= 0) {
      this._tabs.splice(index, 1);
      await this.store();
    }
  }

  /**
   * Clears the stored tabs array.
   */
  async clearAll() {
    this._tabs = [];
    await this.store();
  }
}
