/**
 * Tab type definitions.
 */
export enum NoteTabType {
  Temporary = 1,
  Open = 2, // currently not used
  Pinned = 3
}

/**
 * Helper class to work with note tabs array.
 * - Read settings array once at startup.
 * - Then work on this._tabs array.
 */
export class NoteTabs {

  /**
   * Temporary array to work with tabs.
   * 
   * Definition of one tab entry:
   * [{
   *   "id": "note id",
   *   "type": NoteTabType
   * }]
   */
  private _tabs: any[];

  /**
  * Init with noteTabs settings array.
  */
  constructor(noteTabs: any[]) {
    this._tabs = noteTabs;
  }

  //#region  GETTER

  /**
   * All note tabs.
   */
  get all(): any[] {
    return this._tabs;
  }

  /**
   * Number of tabs.
   */
  get length(): number {
    return this._tabs.length;
  }

  /**
   * Index of the temporary tab. -1 if not exist.
   */
  get indexOfTemp(): number {
    return this._tabs.findIndex(x => x.type === NoteTabType.Temporary);
  }

  //#endregion

  /**
   * Inserts handled tab at specified index.
   */
  private async insertAtIndex(index: number, tab: any) {
    if (index < 0 || tab === undefined) return;

    this._tabs.splice(index, 0, tab);
  }

  /**
   * Gets the tab for the handled note.
   */
  get(index: number): any {
    if (index < 0 || index >= this.length) return;

    return this._tabs[index];
  }

  /**
   * Gets index of tab for note with handled id. -1 if not exist.
   */
  indexOf(noteId: string): number {
    return this._tabs.findIndex(x => x.id === noteId);
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
  }

  /**
   * Moves the tab on source index to the target index.
   */
  async moveWithIndex(sourceIdx: number, targetIdx: number) {
    if (sourceIdx < 0 || sourceIdx >= this.length) return;
    if (targetIdx < 0 || targetIdx >= this.length) return;

    const tab: any = this._tabs[sourceIdx];
    await this.delete(this.get(sourceIdx).id);
    await this.insertAtIndex((targetIdx == 0 ? 0 : targetIdx), tab);
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
      this._tabs[index].type = newType;
    }
  }

  /**
   * Replaces tab at specified index with handled one.
   */
  async replaceTemp(noteId: string) {
    if (noteId === undefined) return;

    const tempIdx: number = this.indexOfTemp;
    if (tempIdx >= 0) {
      this._tabs[tempIdx].id = noteId;
    }
  }

  /**
   * Removes tab on handled index.
   */
  async delete(noteId: string) {
    const index = this.indexOf(noteId);
    if (index >= 0) {
      this._tabs.splice(index, 1);
    }
  }

  /**
   * Clears the stored tabs array.
   */
  async clearAll() {
    this._tabs = [];
  }
}
