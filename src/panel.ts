import joplin from 'api';
import { NoteTabType, NoteTabs } from './noteTabs';
import { Settings } from './settings';

export class Panel {

  private _panel: any;
  private _tabs: NoteTabs;
  private _settings: Settings;

  constructor(tabs: NoteTabs, settings: Settings) {
    this._tabs = tabs;
    this._settings = settings;
  }

  private async toggleTodoState(noteId: string, checked: any) {
    try {
      const note: any = await joplin.data.get(['notes', noteId], { fields: ['id', 'is_todo', 'todo_completed'] });
      if (note.is_todo && checked) {
        await joplin.data.put(['notes', note.id], null, { todo_completed: Date.now() });
      } else {
        await joplin.data.put(['notes', note.id], null, { todo_completed: 0 });
      }
      // updateWebview() is called from onNoteChange event
    } catch (error) {
      return;
    }
  }

  /**
   * Gets an array of all parents starting from the handled parent_id.
   * Consider first entry is handled parent.
   */
  private async getNoteParents(parent_id: string): Promise<any[]> {
    const parents: any[] = new Array();
    let last_id: string = parent_id;

    while (last_id) {
      const parent: any = await joplin.data.get(['folders', last_id], { fields: ['id', 'title', 'parent_id'] });
      if (!parent) break;
      last_id = parent.parent_id;
      parents.push(parent);
    }
    return parents;
  }

  // create HTML for each tab
  private async getNoteTabsHtml(selectedNote: any): Promise<string> {
    const showCompletedTodos: boolean = await this._settings.showCompletedTodos;
    const noteTabsHtml: any = [];

    for (const noteTab of this._tabs.tabs) {
      let note: any = null;

      // get real note from database, if no longer exists remove tab and continue with next one
      try {
        note = await joplin.data.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
        // console.log(`add note: ${JSON.stringify(note)}`);
      } catch (error) {
        // console.log(`delete note: ${noteTab.id}`);
        await this._tabs.delete(noteTab.id);
        continue;
      }

      if (note) {
        // continue with next tab if completed todos shall not be shown
        if ((!showCompletedTodos) && note.todo_completed) continue;

        // prepare tab style attributes
        const bg: string = (selectedNote && note.id == selectedNote.id) ? this._settings.actBackground : this._settings.background;
        const fg: string = (selectedNote && note.id == selectedNote.id) ? this._settings.actForeground : this._settings.foreground;
        const newTab: string = (noteTab.type == NoteTabType.Temporary) ? ' new' : '';
        const icon: string = (noteTab.type == NoteTabType.Pinned) ? 'fa-times' : 'fa-thumbtack';
        const iconTitle: string = (noteTab.type == NoteTabType.Pinned) ? 'Unpin' : 'Pin';
        const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

        // prepare checkbox for todo
        let checkboxHtml: string = '';
        if (this._settings.showTodoCheckboxes && note.is_todo) {
          checkboxHtml = `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''}>`;
        }

        noteTabsHtml.push(`
          <div id="tab" data-id="${note.id}" data-bg="${bg}" draggable="${this._settings.enableDragAndDrop}" class="${newTab}" role="tab" title="${note.title}"
            onclick="tabClick(event);" ondblclick="pinNote(event);" onmouseover="setBackground(event,'${this._settings.hoverBackground}');" onmouseout="resetBackground(this);"
            ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event, '${this._settings.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);"
            style="height:${this._settings.tabHeight}px;min-width:${this._settings.minTabWidth}px;max-width:${this._settings.maxTabWidth}px;border-color:${this._settings.dividerColor};background:${bg};">
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

    return noteTabsHtml.join('\n');
  }

  // prepare control buttons, if drag&drop is disabled
  private getControlsHtml(): string {
    let controlsHtml: string = '';

    if (!this._settings.enableDragAndDrop) {
      controlsHtml = `
        <div id="controls" style="height:${this._settings.tabHeight}px;">
          <a href="#" class="fas fa-chevron-left" title="Move active tab left" style="color:${this._settings.foreground};" onclick="message('tabsMoveLeft');"></a>
          <a href="#" class="fas fa-chevron-right" title="Move active tab right" style="color:${this._settings.foreground};" onclick="message('tabsMoveRight');"></a>
        </div>
      `;
    }
    return controlsHtml;
  }

  // prepare navigation buttons, if enabled
  // prepare breadcrumbs, if enabled
  private async getBreadcrumbsHtml(selectedNote: any): Promise<string> {
    let breadcrumbsHtml: string = '';

    if (this._settings.showBreadcrumbs && selectedNote) {
      let navigationHtml: string = '';
      if (this._settings.showNavigationButtons) {
        navigationHtml = `
            <div class="navigation-icons" style="border-color:${this._settings.dividerColor};">
              <a href="#" class="fas fa-chevron-left" title="Back" style="color:${this._settings.foreground};" onclick="message('tabsBack');"></a>
              <a href="#" class="fas fa-chevron-right" title="Forward" style="color:${this._settings.foreground};" onclick="message('tabsForward');"></a>
            </div>
          `;
      }

      let parentsHtml: any[] = new Array();
      let parents: any[] = await this.getNoteParents(selectedNote.parent_id);

      // collect all parent folders and prepare html container for each
      while (parents) {
        const parent: any = parents.pop();
        if (!parent) break;

        parentsHtml.push(`
          <div class="breadcrumb" data-id="${parent.id}" onClick="openFolder(event);"
            style="min-width:${this._settings.breadcrumbsMinWidth}px;max-width:${this._settings.breadcrumbsMaxWidth}px;">
            <span class="breadcrumb-inner">
              <a href="#" class="breadcrumb-title" style="color:${this._settings.foreground};" title="${parent.title}">${parent.title}</a>
              <span class="fas fa-chevron-right" style="color:${this._settings.foreground};"></span>
            </span>
          </div>
        `);
      }

      // setup breadcrumbs container html
      breadcrumbsHtml = `
        <div id="breadcrumbs-container" style="background:${this._settings.breadcrumbsBackground};">
          ${navigationHtml}
          <div class="breadcrumbs-icon">
            <span class="fas fa-book" style="color:${this._settings.foreground};"></span>
          </div>
          ${parentsHtml.join(`\n`)}
        </div>
      `;
    }
    return breadcrumbsHtml;
  }

  /**
   * Register plugin panel and update webview for the first time.
   */
  async register() {
    this._panel = await joplin.views.panels.create('note.tabs.panel');
    await joplin.views.panels.addScript(this._panel, './assets/fontawesome/css/all.min.css');
    await joplin.views.panels.addScript(this._panel, './webview.css');
    await joplin.views.panels.addScript(this._panel, './webview.js');
    await joplin.views.panels.onMessage(this._panel, async (message: any) => {
      if (message.name === 'tabsOpenFolder') {
        await joplin.commands.execute('openFolder', message.id);
      }
      if (message.name === 'tabsOpen') {
        await joplin.commands.execute('openNote', message.id);
      }
      if (message.name === 'tabsPinNote') {
        let id: string[] = [message.id];
        await joplin.commands.execute('tabsPinNote', id);
      }
      if (message.name === 'tabsUnpinNote') {
        let id: string[] = [message.id];
        await joplin.commands.execute('tabsUnpinNote', id);
      }
      if (message.name === 'tabsToggleTodo') {
        // TODO move to index.ts as internal command
        await this.toggleTodoState(message.id, message.checked);
      }
      if (message.name === 'tabsMoveLeft') {
        await joplin.commands.execute('tabsMoveLeft');
      }
      if (message.name === 'tabsMoveRight') {
        await joplin.commands.execute('tabsMoveRight');
      }
      if (message.name === 'tabsBack') {
        await joplin.commands.execute('historyBackward');
      }
      if (message.name === 'tabsForward') {
        await joplin.commands.execute('historyForward');
      }
      if (message.name === 'tabsDrag') {
        // TODO move to index.ts as internal command
        await this._tabs.moveWithId(message.sourceId, message.targetId);
        await this.updateWebview();
      }
      if (message.name === 'tabsDragNotes') {
        await joplin.commands.execute('tabsPinNote', message.noteIds, message.targetId);
      }
    });

    // set init message
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this._settings.background};font-family:'${this._settings.fontFamily}',sans-serif;font-size:${this._settings.fontSize};">
        <div id="tabs-container">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);
  }

  /**
   * Update the HTML webview with actual content.
   */
  async updateWebview() {
    const selectedNote: any = await joplin.workspace.selectedNote();
    const noteTabsHtml: string = await this.getNoteTabsHtml(selectedNote);
    const controlsHtml: string = this.getControlsHtml();
    const breadcrumbsHtml: string = await this.getBreadcrumbsHtml(selectedNote);

    // add entries to container and push to panel
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this._settings.background};font-family:'${this._settings.fontFamily}',sans-serif;font-size:${this._settings.fontSize};">
        <div id="tabs-container" role="tablist" draggable="${this._settings.enableDragAndDrop}"
          ondragend="dragEnd(event);" ondragover="dragOver(event, '${this._settings.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);">
          ${noteTabsHtml}
          ${controlsHtml}
        </div>
        ${breadcrumbsHtml}
      </div>
    `);
  }

  /**
   * Toggle visibility of the panel.
   */
  async toggleVisibility() {
    const isVisible: boolean = await joplin.views.panels.visible(this._panel);
    await joplin.views.panels.show(this._panel, (!isVisible));
  }
}