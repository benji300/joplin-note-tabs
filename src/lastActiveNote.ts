/**
 * Queue to store last active note id.
 * Contains maximum two entries - current (index=1) and last active (index=0).
 */
export class LastActiveNote {
  // stores the ids of the notes
  private _store: string[];

  constructor() {
    this._store = new Array();
  }

  get id(): string | undefined {
    return this._store.shift();
  }

  set id(id: string) {
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

  get length(): number {
    return this._store.length;
  }
}
