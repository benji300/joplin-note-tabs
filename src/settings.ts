import joplin from 'api';
import { SettingItemType } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
enum SettingDefaults {
  Default = 'default',
  FontFamily = 'var(--joplin-font-family)',
  FontSize = 'var(--joplin-font-size)',
  Background = 'var(--joplin-background-color3)',
  HoverBackground = 'var(--joplin-background-color-hover3)', // var(--joplin-background-hover)
  Foreground = 'var(--joplin-color-faded)',
  ActiveBackground = 'var(--joplin-background-color)',
  ActiveForeground = 'var(--joplin-color)',
  DividerColor = 'var(--joplin-divider-color)'
}

export enum AddBehavior {
  Temporary,
  Pinned
}

export enum UnpinBehavior {
  Keep,
  LastActive,
  LeftTab,
  RightTab
}

export enum LayoutMode {
  Auto,
  Horizontal,
  Vertical
}

/**
 * Definitions of plugin settings.
 */
export class Settings {
  // private settings
  private _noteTabs: any[] = new Array();
  // general settings
  private _enableDragAndDrop: boolean = true;
  private _showTodoCheckboxes: boolean = false;
  private _showBreadcrumbs: boolean = false;
  private _showNavigationButtons: boolean = false;
  private _showChecklistStatus: boolean = false;
  private _pinEditedNotes: boolean = false;
  private _unpinCompletedTodos: boolean = false;
  private _addBehavior: AddBehavior = AddBehavior.Temporary;
  private _unpinBehavior: UnpinBehavior = UnpinBehavior.Keep;
  private _layoutMode: number = LayoutMode.Auto;
  // advanced settings
  private _tabHeight: number = 35;
  private _minTabWidth: number = 50;
  private _maxTabWidth: number = 150;
  private _breadcrumbsMaxWidth: number = 100;
  private _fontFamily: string = SettingDefaults.Default;
  private _fontSize: string = SettingDefaults.Default;
  private _background: string = SettingDefaults.Default;
  private _hoverBackground: string = SettingDefaults.Default;
  private _actBackground: string = SettingDefaults.Default;
  private _breadcrumbsBackground: string = SettingDefaults.Default;
  private _foreground: string = SettingDefaults.Default;
  private _actForeground: string = SettingDefaults.Default;
  private _dividerColor: string = SettingDefaults.Default;
  // internals
  private _defaultRegExp: RegExp = new RegExp(SettingDefaults.Default, "i");

  constructor() {
  }

  //#region GETTER

  get noteTabs(): any[] {
    return this._noteTabs;
  }

  get enableDragAndDrop(): boolean {
    return this._enableDragAndDrop;
  }

  get showTodoCheckboxes(): boolean {
    return this._showTodoCheckboxes;
  }

  get showBreadcrumbs(): boolean {
    return this._showBreadcrumbs;
  }

  get showNavigationButtons(): boolean {
    return this._showNavigationButtons;
  }

  get showChecklistStatus(): boolean {
    return this._showChecklistStatus;
  }

  get pinEditedNotes(): boolean {
    return this._pinEditedNotes;
  }

  get unpinCompletedTodos(): boolean {
    return this._unpinCompletedTodos;
  }

  hasAddBehavior(behavior: AddBehavior): boolean {
    return (this._addBehavior === behavior);
  }

  get unpinBehavior(): UnpinBehavior {
    return this._unpinBehavior;
  }

  hasLayoutMode(mode: LayoutMode): boolean {
    return (this._layoutMode === mode);
  }

  get tabHeight(): number {
    return this._tabHeight;
  }

  get minTabWidth(): number {
    return this._minTabWidth;
  }

  get maxTabWidth(): number {
    return this._maxTabWidth;
  }

  get breadcrumbsMaxWidth(): number {
    return this._breadcrumbsMaxWidth;
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  get fontSize(): string {
    return this._fontSize;
  }

  get background(): string {
    return this._background;
  }

  get hoverBackground(): string {
    return this._hoverBackground;
  }

  get actBackground(): string {
    return this._actBackground;
  }

  get breadcrumbsBackground(): string {
    return this._breadcrumbsBackground;
  }

  get foreground(): string {
    return this._foreground;
  }

  get actForeground(): string {
    return this._actForeground;
  }

  get dividerColor(): string {
    return this._dividerColor;
  }

  //#endregion

  //#region GLOBAL VALUES

  get showCompletedTodos(): Promise<boolean> {
    return joplin.settings.globalValue('showCompletedTodos');
  }

  //#endregion

  /**
   * Register settings section with all options and intially read them at the end.
   */
  async register() {
    // register settings in own section
    await joplin.settings.registerSection('note.tabs.settings', {
      label: 'Note Tabs',
      iconName: 'fas fa-window-maximize'
    });
    await joplin.settings.registerSettings({
      // private settings
      noteTabs: {
        value: [],
        type: SettingItemType.Array,
        section: 'note.tabs.settings',
        public: false,
        label: 'Note tabs'
      },
      // general settings
      enableDragAndDrop: {
        value: this._enableDragAndDrop,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Enable drag & drop of tabs',
        description: 'If disabled, position of tabs can be change via commands or move buttons.'
      },
      showTodoCheckboxes: {
        value: this._showTodoCheckboxes,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Show to-do checkboxes on tabs',
        description: 'If enabled, to-dos can be completed directly on the tabs.'
      },
      showBreadcrumbs: {
        value: this._showBreadcrumbs,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Show breadcrumbs',
        description: 'Display full breadcrumbs for selected note. Displayed below the tabs in horizontal layout only.'
      },
      showNavigationButtons: {
        value: this._showNavigationButtons,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Show navigation buttons',
        description: 'Display history backward and forward buttons. Displayed below the tabs in horizontal layout only.'
      },
      showChecklistStatus: {
        value: this._showChecklistStatus,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Show checklist completion status',
        description: 'Display completion status of all checklists in the selected note. Displayed below the tabs in horizontal layout only.'
      },
      pinEditedNotes: {
        value: this._pinEditedNotes,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Automatically pin notes when edited',
        description: 'Pin notes automatically as soon as the title, content or any other attribute changes.'
      },
      unpinCompletedTodos: {
        value: this._unpinCompletedTodos,
        type: SettingItemType.Bool,
        section: 'note.tabs.settings',
        public: true,
        label: 'Automatically unpin completed to-dos',
        description: 'Unpin notes automatically as soon as the to-do status changes to completed. ' +
          'Closes the tab unless it is the selected note.'
      },
      addBehavior: {
        value: AddBehavior.Temporary,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        isEnum: true,
        public: true,
        label: 'Add tab behavior',
        description: 'Specify how new tabs are added to the panel. Either as temporary or directly as pinned tab. ' +
          'Only one temporary tab (italic font) exists at a time.',
        options: {
          '0': 'Temporary',
          '1': 'Pinned'
        }
      },
      unpinBehavior: {
        value: UnpinBehavior.Keep,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        isEnum: true,
        public: true,
        label: 'Unpin active tab behavior',
        description: 'Specify the behavior when unpinning the current active tab. ' +
          'Either keep the active tab selected or select another one, depending on the setting.' +
          "In case 'Keep selected' is set, the temporary tab (shown with italic font in the tab list) may be replaced with the current active tab.",
        options: {
          '0': 'Keep selected',
          '1': 'Select last active tab',
          '2': 'Select left tab',
          '3': 'Select right tab'
        }
      },
      layoutMode: {
        value: LayoutMode.Auto,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        isEnum: true,
        public: true,
        label: 'Force tabs layout',
        description: 'Force tabs horizontal or vertical layout. If Auto, the layout switches automatically at a width of about 400px. Requires restart to be applied.',
        options: {
          '0': 'Auto',
          '1': 'Horizontal',
          '2': 'Vertical'
        }
      },
      // advanced settings
      tabHeight: {
        value: this._tabHeight,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Note Tabs height (px)',
        description: 'Height of the tabs. Row height in vertical layout.'
      },
      minTabWidth: {
        value: this._minTabWidth,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Minimum Tab width (px)',
        description: 'Minimum width of one tab in pixel.'
      },
      maxTabWidth: {
        value: this._maxTabWidth,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Maximum Tab width (px)',
        description: 'Maximum width of one tab in pixel.'
      },
      breadcrumbsMaxWidth: {
        value: this._breadcrumbsMaxWidth,
        type: SettingItemType.Int,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Maximum breadcrumb width (px)',
        description: 'Maximum width of one breadcrumb in pixel.'
      },
      fontFamily: {
        value: this._fontFamily,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Font family',
        description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: App default)"
      },
      fontSize: {
        value: this._fontSize,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Font size',
        description: "Font size used in the panel. Values other than 'default' must be specified in valid CSS syntax, e.g. '13px'. (default: App default font size)"
      },
      mainBackground: {
        value: this._background,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Background color',
        description: 'Main background color of the panel. (default: Note list background color)'
      },
      hoverBackground: {
        value: this._hoverBackground,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Hover Background color',
        description: 'Background color used when hovering a favorite. (default: Note list hover color)'
      },
      activeBackground: {
        value: this._actBackground,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Active background color',
        description: 'Background color of the current active tab. (default: Editor background color)'
      },
      breadcrumbsBackground: {
        value: this._breadcrumbsBackground,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Infobar background color',
        description: 'Background color of the info bar (incl. breadcrumbs, etc.) below the tabs. (default: Editor background color)'
      },
      mainForeground: {
        value: this._foreground,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Foreground color',
        description: 'Foreground color used for text and icons. (default: App faded color)'
      },
      activeForeground: {
        value: this._actForeground,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Active foreground color',
        description: 'Foreground color of the current active tab. (default: Editor font color)'
      },
      dividerColor: {
        value: this._dividerColor,
        type: SettingItemType.String,
        section: 'note.tabs.settings',
        public: true,
        advanced: true,
        label: 'Divider color',
        description: 'Color of the divider between the tabs. (default: App default border color)'
      }
    });
    this._noteTabs = await joplin.settings.value('noteTabs');

    // initially read settings
    await this.read();
  }

  private async getOrDefault(event: ChangeEvent, localVar: any, setting: string, defaultValue?: string): Promise<any> {
    const read: boolean = (!event || event.keys.includes(setting));
    if (read) {
      const value: string = await joplin.settings.value(setting);
      if (defaultValue && value.match(this._defaultRegExp)) {
        return defaultValue;
      } else {
        return value;
      }
    }
    return localVar;
  }

  /**
   * Update settings. Either all or only changed ones.
   */
  async read(event?: ChangeEvent) {
    this._enableDragAndDrop = await this.getOrDefault(event, this._enableDragAndDrop, 'enableDragAndDrop');
    this._showTodoCheckboxes = await this.getOrDefault(event, this._showTodoCheckboxes, 'showTodoCheckboxes');
    this._showBreadcrumbs = await this.getOrDefault(event, this._showBreadcrumbs, 'showBreadcrumbs');
    this._showNavigationButtons = await this.getOrDefault(event, this._showNavigationButtons, 'showNavigationButtons');
    this._showChecklistStatus = await this.getOrDefault(event, this._showChecklistStatus, 'showChecklistStatus');
    this._pinEditedNotes = await this.getOrDefault(event, this._pinEditedNotes, 'pinEditedNotes');
    this._unpinCompletedTodos = await this.getOrDefault(event, this._unpinCompletedTodos, 'unpinCompletedTodos');
    this._addBehavior = await this.getOrDefault(event, this._addBehavior, 'addBehavior');
    this._unpinBehavior = await this.getOrDefault(event, this._unpinBehavior, 'unpinBehavior');
    this._layoutMode = await this.getOrDefault(event, this._layoutMode, 'layoutMode');
    this._tabHeight = await this.getOrDefault(event, this._tabHeight, 'tabHeight');
    this._minTabWidth = await this.getOrDefault(event, this._minTabWidth, 'minTabWidth');
    this._maxTabWidth = await this.getOrDefault(event, this._maxTabWidth, 'maxTabWidth');
    this._breadcrumbsMaxWidth = await this.getOrDefault(event, this._breadcrumbsMaxWidth, 'breadcrumbsMaxWidth');
    this._fontFamily = await this.getOrDefault(event, this._fontFamily, 'fontFamily', SettingDefaults.FontFamily);
    this._fontSize = await this.getOrDefault(event, this._fontSize, 'fontSize', SettingDefaults.FontSize);
    this._background = await this.getOrDefault(event, this._background, 'mainBackground', SettingDefaults.Background);
    this._hoverBackground = await this.getOrDefault(event, this._hoverBackground, 'hoverBackground', SettingDefaults.HoverBackground);
    this._actBackground = await this.getOrDefault(event, this._actBackground, 'activeBackground', SettingDefaults.ActiveBackground);
    this._breadcrumbsBackground = await this.getOrDefault(event, this._breadcrumbsBackground, 'breadcrumbsBackground', SettingDefaults.ActiveBackground);
    this._foreground = await this.getOrDefault(event, this._foreground, 'mainForeground', SettingDefaults.Foreground);
    this._actForeground = await this.getOrDefault(event, this._actForeground, 'activeForeground', SettingDefaults.ActiveForeground);
    this._dividerColor = await this.getOrDefault(event, this._dividerColor, 'dividerColor', SettingDefaults.DividerColor);
  }

  /**
   * Store the tabs array back to the settings.
   */
  async storeTabs() {
    await joplin.settings.setValue('noteTabs', this._noteTabs);
  }

  /**
   * Clear the settings tabs array.
   */
  async clearTabs() {
    this._noteTabs = [];
    await this.storeTabs();
  }
}
