import { NoteTabType } from './noteTabs';

interface IClosedTab {
  // Joplin note ID
  id: string;
  // type the tab had when it was closed, so reopening restores it the same way
  type: NoteTabType;
  // id of the tab that immediately followed this one when it was closed, used
  // to restore its original position - undefined if it was the last tab
  nextTabId?: string;
}

/**
 * Stack of recently closed tabs, most-recent last.
 * In-memory only - not persisted across app restarts, same as LastActiveNote.
 */
export class ClosedTabs {
  private _store: IClosedTab[] = [];

  push(tab: IClosedTab) {
    // avoid duplicate entries if the same tab gets closed again while still on the stack
    this._store = this._store.filter(x => x.id !== tab.id);
    this._store.push(tab);
  }

  pop(): IClosedTab | undefined {
    return this._store.pop();
  }

  get length(): number {
    return this._store.length;
  }
}
