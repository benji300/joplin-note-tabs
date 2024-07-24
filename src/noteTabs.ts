import { Settings } from "./settings";

/**
 * Tab type definitions.
 */
export enum NoteTabType {
  Temporary = 1,
  Open = 2, // currently not used
  Pinned = 3
}

/**
 * Definition of note tab entries.
 */
interface INoteTab {
  // Joplin note ID
  id: string,
  // Type of the tab
  type: NoteTabType
}

/**
 * Helper class to work with note tabs.
 * - Read settings array once at startup.
 * - Then work on this.tabs array.
 */
export class NoteTabs {
  private _settings: Settings;

  /**
   * Initialization of NoteTabs.
   */
  constructor(settings: Settings) {
    this._settings = settings;
  }

  //#region GETTER

  /**
   * All note tabs.
   */
  get tabs(): INoteTab[] {
    return this._settings.noteTabs;
  }

  /**
   * Number of tabs.
   */
  get length(): number {
    return this.tabs.length;
  }

  /**
   * Index of the temporary tab. -1 if not exist.
   */
  get indexOfTemp(): number {
    return this.tabs.findIndex(x => x.type === NoteTabType.Temporary);
  }

  //#endregion

  /**
   * Write tabs array back to settings.
   * 
   * TODO: Would be better in an "onClose()" event of the plugin. Then they would only be stored once.
   */
  private async store() {
    await this._settings.storeTabs();
  }

  /**
   * Gets a value whether the handled index would lead to out of bound access.
   */
  private indexOutOfBounds(index: number): boolean {
    return (index < 0 || index >= this.length);
  }

  static isTemporary(tab: INoteTab): boolean {
    if (tab) {
      return (tab.type === NoteTabType.Temporary);
    }
    return false;
  }

  static isPinned(tab: INoteTab): boolean {
    if (tab) {
      return (tab.type === NoteTabType.Pinned);
    }
    return false;
  }

  /**
   * Gets the tab for the handled note.
   */
  get(index: number): INoteTab {
    if (this.indexOutOfBounds(index)) return;

    return this.tabs[index];
  }

  /**
   * Gets index of tab for note with handled id. -1 if not exist.
   */
  indexOf(noteId: string): number {
    return this.tabs.findIndex(x => x.id === noteId);
  }

  /**
   * Gets a value whether the handled note has already a tab or not.
   */
  hasTab(noteId: string): boolean {
    return (this.tabs.find(x => x.id === noteId) !== undefined);
  }

  /**
   * Adds note as new tab at the end.
   */
  async add(newId: string, newType: NoteTabType, targetId?: string) {
    if (newId === undefined || newType === undefined) return;

    const index = this.indexOf(targetId);
    const newTab: any = { id: newId, type: newType };
    if (index >= 0) {
      this.tabs.splice(index, 0, newTab);
    } else {
      this.tabs.push(newTab);
    }
    await this.store();
  }

  /**
   * Moves the tab on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (this.indexOutOfBounds(sourceIdx)) return;
    if (this.indexOutOfBounds(targetIdx)) return;

    const tab: any = this.tabs[sourceIdx];
    this.tabs.splice(sourceIdx, 1);
    this.tabs.splice((targetIdx == 0 ? 0 : targetIdx), 0, tab);
    await this.store();
  }

  /**
   * Moves the tab of source note to the index of the target note.
   */
  async moveWithId(sourceId: string, targetId: string) {
    const targetIdx: number = (targetId) ? this.indexOf(targetId) : (this.length - 1);
    await this.moveWithIndex(this.indexOf(sourceId), targetIdx);
  }

  /**
    * Changes type of the tab for the handled note.
    */
  async changeType(noteId: string, newType: NoteTabType) {
    const index = this.indexOf(noteId);
    if (index >= 0) {
      this.tabs[index].type = newType;
      await this.store();
    }
  }

  /**
   * Replaces tab at specified index with handled one.
   */
  async replaceTemp(noteId: string) {
    if (noteId === undefined) return;

    const tempIdx: number = this.indexOfTemp;
    if (tempIdx >= 0) {
      this.tabs[tempIdx].id = noteId;
      await this.store();
    }
  }

  /**
   * Deletes tab on handled index.
   */
  async delete(noteId: string) {
    const index = this.indexOf(noteId);
    if (index >= 0) {
      this.tabs.splice(index, 1);
      await this.store();
    }
  }
}
