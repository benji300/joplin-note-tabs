import joplin from 'api';
import { NoteTabs } from './noteTabs';
import { Settings, LayoutMode } from './settings';

export class Panel {
  private _panel: any;
  private _tabs: NoteTabs;
  private _settings: Settings;

  constructor(tabs: NoteTabs, settings: Settings) {
    this._tabs = tabs;
    this._settings = settings;
  }

  private get tabs() {
    return this._tabs;
  }

  private get sets() {
    return this._settings;
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
   * Register plugin panel and update webview for the first time.
   */
  async register() {
    this._panel = await joplin.views.panels.create('note.tabs.panel');
    await joplin.views.panels.addScript(this._panel, './webview.css');
    if (this.sets.hasLayoutMode(LayoutMode.Auto)) {
      await joplin.views.panels.addScript(this._panel, './webview_auto.css');
    }
    if (this.sets.hasLayoutMode(LayoutMode.Vertical)) {
      await joplin.views.panels.addScript(this._panel, './webview_vertical.css');
    }
    await joplin.views.panels.addScript(this._panel, './webview.js');

    // message handler
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
        await this.tabs.moveWithId(message.sourceId, message.targetId);
        await this.updateWebview();
      }
      if (message.name === 'tabsDragNotes') {
        await joplin.commands.execute('tabsPinNote', message.noteIds, message.targetId);
      }
    });

    // set init message
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this.sets.background};font-family:${this.sets.fontFamily},sans-serif;font-size:${this.sets.fontSize};">
        <div id="tabs-container">
          <p style="padding-left:8px;">Loading panel...</p>
        </div>
      </div>
    `);
  }

  private escapeHtml(key: any): String {
    return String(key)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

  /**
   * Gets all checklist items (with checked state) from the notes body.
   */
  private getNoteChecklistItems(noteBody: string): any[] {
    let items: any[] = [];
    for (const line of noteBody.split('\n')) {
      const match = line.match(/^\s*(-\s+\[(x|\s)\])/);
      if (match) {
        items.push({ checked: match[2].includes("x", 0) });
      }
    }
    return items;
  }

  /**
   * Prepares HTML for all tabs
   */
  private async getNoteTabsHtml(selectedNote: any): Promise<string> {
    const showCompletedTodos: boolean = await this.sets.showCompletedTodos;
    const noteTabsHtml: any = [];

    for (const noteTab of this.tabs.tabs) {
      let note: any = null;

      // get real note from database, if no longer exists delete tab and continue with next one
      try {
        note = await joplin.data.get(['notes', noteTab.id], { fields: ['id', 'title', 'is_todo', 'todo_completed'] });
        // console.log(`add note: ${JSON.stringify(note)}`);
      } catch (error) {
        // console.log(`delete note: ${noteTab.id}`);
        await this.tabs.delete(noteTab.id);
        continue;
      }

      if (note) {
        // continue with next tab if completed todos shall not be shown
        if ((!showCompletedTodos) && note.todo_completed) continue;

        // prepare tab style attributes
        const title: String = this.escapeHtml(note.title);
        const bg: string = (selectedNote && note.id == selectedNote.id) ? this.sets.actBackground : this.sets.background;
        const fg: string = (selectedNote && note.id == selectedNote.id) ? this.sets.actForeground : this.sets.foreground;
        const active: string = (selectedNote && note.id == selectedNote.id) ? 'active' : '';
        const newTab: string = (NoteTabs.isTemporary(noteTab)) ? ' new' : '';
        const icon: string = (NoteTabs.isPinned(noteTab)) ? 'fa-times' : 'fa-thumbtack';
        const iconTitle: string = (NoteTabs.isPinned(noteTab)) ? 'Unpin' : 'Pin';
        const textDecoration: string = (note.is_todo && note.todo_completed) ? 'line-through' : '';

        // prepare checkbox for todo
        let checkboxHtml: string = '';
        if (this.sets.showTodoCheckboxes && note.is_todo) {
          checkboxHtml = `<input id="check" type="checkbox" ${(note.todo_completed) ? "checked" : ''}>`;
        }

        noteTabsHtml.push(`
          <div id="tab" ${active} data-id="${note.id}" data-bg="${bg}" draggable="${this.sets.enableDragAndDrop}" class="${newTab}" role="tab" title="${title}"
            onclick="tabClick(event);" ondblclick="pinNote(event);" onauxclick="onAuxClick(event);" onmouseover="setBackground(event,'${this.sets.hoverBackground}');" onmouseout="resetBackground(this);"
            ondragstart="dragStart(event);" ondragend="dragEnd(event);" ondragover="dragOver(event, '${this.sets.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);"
            style="height:${this.sets.tabHeight}px;min-width:${this.sets.minTabWidth}px;max-width:${this.sets.maxTabWidth}px;border-color:${this.sets.dividerColor};background:${bg};">
            <span class="tab-inner">
              ${checkboxHtml}
              <span class="tab-title" style="color:${fg};text-decoration: ${textDecoration};">
                ${title}
              </span>
              <a href="#" id="${iconTitle}" class="fas ${icon}" title="${iconTitle}" style="color:${fg};"></a>
            </span>
          </div>
        `);
      }
    }

    return noteTabsHtml.join('\n');
  }

  /**
   * Prepares HTML for control buttons. Only if drag&drop is disabled.
   */
  private getControlsHtml(): string {
    let controlsHtml: string = '';

    if (!this.sets.enableDragAndDrop) {
      controlsHtml = `
        <div id="controls" style="height:${this.sets.tabHeight}px;">
          <a href="#" class="fas fa-chevron-left" title="Move active tab left" style="color:${this.sets.foreground};" onclick="message('tabsMoveLeft');"></a>
          <a href="#" class="fas fa-chevron-right" title="Move active tab right" style="color:${this.sets.foreground};" onclick="message('tabsMoveRight');"></a>
        </div>
      `;
    }
    return controlsHtml;
  }

  /**
   * Prepares HTML for navigation buttons, checklist states and breadcrumbs. Only if enabled.
   */
  private async getInfoBarHtml(selectedNote: any): Promise<string> {
    let navigationHtml: string = '';
    let checklistStatusHtml: string = '';
    let breadcrumbsHtml: string = '';
    let infobarHtml: string = '';

    // prepare html for navigation buttons, if necessary
    if (this.sets.showNavigationButtons) {
      navigationHtml = `
          <div class="navigation-icons" style="border-color:${this.sets.dividerColor};">
            <a href="#" class="fas fa-chevron-left" title="Back" style="color:${this.sets.foreground};" onclick="message('tabsBack');"></a>
            <a href="#" class="fas fa-chevron-right" title="Forward" style="color:${this.sets.foreground};" onclick="message('tabsForward');"></a>
          </div>
        `;
    }

    // prepare html for checklist items, if necessary
    if (this.sets.showChecklistStatus && selectedNote) {
      const checklistItems: any[] = this.getNoteChecklistItems(selectedNote.body);
      if (checklistItems.length > 0) {
        const all: number = checklistItems.length;
        const checked: number = checklistItems.filter(x => x.checked).length;
        const completed: string = (checked == all) ? 'completed' : '';
        checklistStatusHtml = `
          <div class="checklist-state" style="color:${this.sets.foreground};border-color:${this.sets.dividerColor};">
            <div class="checklist-state-inner">
              <span class="checklist-state-text ${completed}">
                <span class="fas fa-check-square" style=""></span>
                ${checked} / ${all}
              </span>
            </div>
          </div>
        `;
      }
    }

    // prepare html for breadcrumbs, if necessary
    if (this.sets.showBreadcrumbs && selectedNote) {
      let parentsHtml: any[] = new Array();

      // collect all parent folders and prepare html container for each
      let parents: any[] = await this.getNoteParents(selectedNote.parent_id);
      while (parents) {
        const parent: any = parents.pop();
        if (!parent) break;
        parentsHtml.push(`
          <div class="breadcrumb" data-id="${parent.id}" onClick="openFolder(event);"
            style="max-width:${this.sets.breadcrumbsMaxWidth}px;">
            <span class="breadcrumb-inner">
              <a href="#" class="breadcrumb-title" style="color:${this.sets.foreground};" title="${parent.title}">${parent.title}</a>
              <span class="fas fa-chevron-right" style="color:${this.sets.foreground};"></span>
            </span>
          </div>
        `);
      }

      if (parentsHtml) {
        breadcrumbsHtml = `
          <div class="breadcrumbs-icon">
            <span class="fas fa-book" style="color:${this.sets.foreground};"></span>
          </div>
          <div id="breadcrumbs-container">
            ${parentsHtml.join(`\n`)}
          </div>
        `;
      }
    }

    // setup infobar container html, if any of the childs != empty string
    if (navigationHtml || checklistStatusHtml || breadcrumbsHtml) {
      infobarHtml = `
        <div id="infobar-container" style="background:${this.sets.breadcrumbsBackground};">
          ${navigationHtml}
          ${checklistStatusHtml}
          ${breadcrumbsHtml}
        </div>
      `;
    }

    return infobarHtml;
  }

  /**
   * Update the HTML webview with actual content.
   */
  async updateWebview() {
    const selectedNote: any = await joplin.workspace.selectedNote();
    const noteTabsHtml: string = await this.getNoteTabsHtml(selectedNote);
    const controlsHtml: string = this.getControlsHtml();
    const infoBarHtml: string = await this.getInfoBarHtml(selectedNote);

    // add entries to container and push to panel
    await joplin.views.panels.setHtml(this._panel, `
      <div id="container" style="background:${this.sets.background};font-family:${this.sets.fontFamily},sans-serif;font-size:${this.sets.fontSize};">
        <div id="tabs-container" role="tablist" draggable="${this.sets.enableDragAndDrop}"
          ondragover="dragOver(event, '${this.sets.hoverBackground}');" ondragleave="dragLeave(event);" ondrop="drop(event);" ondragend="dragEnd(event);">
          ${noteTabsHtml}
          ${controlsHtml}
        </div>
        ${infoBarHtml}
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