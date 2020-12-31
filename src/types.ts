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
 * Queue to store last active note id.
 * Contains maximum two entries - current (index=1) and last active (index=0).
 */
export class LastActiveNoteQueue {
  // stores the ids of the notes
  _store: string[] = new Array();

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
