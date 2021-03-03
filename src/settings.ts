import joplin from 'api';
import { SettingItemType } from 'api/types';
import { ChangeEvent } from 'api/JoplinSettings';

/**
 * Advanced style setting default values.
 * Used when setting is set to 'default'.
 */
enum SettingDefaults {
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

export enum UnpinBehavior {
  Keep,
  LastActive,
  Adjacent
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
  private _pinEditedNotes: boolean = false;
  private _unpinCompletedTodos: boolean = false;
  private _unpinBehavior: number = UnpinBehavior.Keep;
  private _layoutMode: number = LayoutMode.Auto;
  // advanced settings
  private _tabHeight: number = 35;
  private _minTabWidth: number = 50;
  private _maxTabWidth: number = 150;
  private _breadcrumbsMinWidth: number = 10;
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

  get pinEditedNotes(): boolean {
    return this._pinEditedNotes;
  }

  get unpinCompletedTodos(): boolean {
    return this._unpinCompletedTodos;
  }

  get unpinBehavior(): LayoutMode {
    return this._unpinBehavior;
  }

  get layoutMode(): LayoutMode {
    return this._layoutMode;
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

  get breadcrumbsMinWidth(): number {
    return this._breadcrumbsMinWidth;
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
    // settings section
    await joplin.settings.registerSection('note.tabs.settings', {
      label: 'Note Tabs',
      iconName: 'fas fa-window-maximize'
    });

    // private settings
    await joplin.settings.registerSetting('noteTabs', {
      value: [],
      type: SettingItemType.Array,
      section: 'note.tabs.settings',
      public: false,
      label: 'Note tabs'
    });
    this._noteTabs = await joplin.settings.value('noteTabs');

    // general settings
    await joplin.settings.registerSetting('enableDragAndDrop', {
      value: this._enableDragAndDrop,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Enable drag & drop of tabs',
      description: 'If disabled, position of tabs can be change via commands or move buttons.'
    });
    await joplin.settings.registerSetting('showTodoCheckboxes', {
      value: this._showTodoCheckboxes,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Show to-do checkboxes on tabs',
      description: 'If enabled, to-dos can be completed directly on the tabs.'
    });
    await joplin.settings.registerSetting('showBreadcrumbs', {
      value: this._showBreadcrumbs,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Show breadcrumbs below tabs',
      description: 'Display full breadcrumbs for selected note below tabs. Only available in horizontal layout mode.'
    });
    await joplin.settings.registerSetting('showNavigationButtons', {
      value: this._showNavigationButtons,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Show navigation buttons below tabs',
      description: 'Display history backward and forward buttons before the breadcrumds. Only visible if breadcrumbs are also enabled and visible.'
    });
    await joplin.settings.registerSetting('pinEditedNotes', {
      value: this._pinEditedNotes,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Automatically pin notes when edited',
      description: 'Pin notes automatically as soon as the title, content or any other attribute changes.'
    });
    await joplin.settings.registerSetting('unpinCompletedTodos', {
      value: this._unpinCompletedTodos,
      type: SettingItemType.Bool,
      section: 'note.tabs.settings',
      public: true,
      label: 'Automatically unpin completed to-dos',
      description: 'Unpin notes automatically as soon as the to-do status changes to completed. Removes the tab completely unless it is the selected note.'
    });
    await joplin.settings.registerSetting('unpinBehavior', {
      value: UnpinBehavior.Keep,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      isEnum: true,
      public: true,
      label: 'Unpin active tab behavior',
      description: 'Specify behavior when unpinning the current active tab. ' +
        'Either keep tab selected (reappears as temporary tab - old behavior), select the last active tab (edited note) or select one of the adjacent tabs. ' +
        'Where the latter one can either be the left or right adjacent tab, depending on which exists.',
      options: {
        '0': 'Keep selected',
        '1': 'Select last active',
        '2': 'Select adjacent'
      },
    });
    await joplin.settings.registerSetting('layoutMode', {
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
      },
    });
    // advanced settings
    await joplin.settings.registerSetting('tabHeight', {
      value: this._tabHeight,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Note Tabs height (px)',
      description: 'Height of the tabs. Row height in vertical layout.'
    });
    await joplin.settings.registerSetting('minTabWidth', {
      value: this._minTabWidth,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Minimum Tab width (px)',
      description: 'Minimum width of one tab in pixel.'
    });
    await joplin.settings.registerSetting('maxTabWidth', {
      value: this._maxTabWidth,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Maximum Tab width (px)',
      description: 'Maximum width of one tab in pixel.'
    });
    await joplin.settings.registerSetting('breadcrumbsMinWidth', {
      value: this._breadcrumbsMinWidth,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Minimum breadcrumb width (px)',
      description: 'Minimum width of one breadcrumb in pixel.'
    });
    await joplin.settings.registerSetting('breadcrumbsMaxWidth', {
      value: this._breadcrumbsMaxWidth,
      type: SettingItemType.Int,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Maximum breadcrumb width (px)',
      description: 'Maximum width of one breadcrumb in pixel.'
    });
    await joplin.settings.registerSetting('fontFamily', {
      value: this._fontFamily,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Font family',
      description: "Font family used in the panel. Font families other than 'default' must be installed on the system. If the font is incorrect or empty, it might default to a generic sans-serif font. (default: Roboto)"
    });
    await joplin.settings.registerSetting('fontSize', {
      value: this._fontSize,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Font size',
      description: "Font size used in the panel. Values other than 'default' must be specified in valid CSS syntax, e.g. '13px'. (default: App default font size)"
    });
    await joplin.settings.registerSetting('mainBackground', {
      value: this._background,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Background color',
      description: 'Main background color of the panel. (default: Note list background color)'
    });
    await joplin.settings.registerSetting('hoverBackground', {
      value: this._hoverBackground,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Hover Background color',
      description: 'Background color used when hovering a favorite. (default: Note list hover color)'
    });
    await joplin.settings.registerSetting('activeBackground', {
      value: this._actBackground,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Active background color',
      description: 'Background color of the current active tab. (default: Editor background color)'
    });
    await joplin.settings.registerSetting('breadcrumbsBackground', {
      value: this._breadcrumbsBackground,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Breadcrumbs background color',
      description: 'Background color of the breadcrumbs. (default: Editor background color)'
    });
    await joplin.settings.registerSetting('mainForeground', {
      value: this._foreground,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Foreground color',
      description: 'Foreground color used for text and icons. (default: App faded color)'
    });
    await joplin.settings.registerSetting('activeForeground', {
      value: this._actForeground,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Active foreground color',
      description: 'Foreground color of the current active tab. (default: Editor font color)'
    });
    await joplin.settings.registerSetting('dividerColor', {
      value: this._dividerColor,
      type: SettingItemType.String,
      section: 'note.tabs.settings',
      public: true,
      advanced: true,
      label: 'Divider color',
      description: 'Color of the divider between the tabs. (default: App default border color)'
    });

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
    this._pinEditedNotes = await this.getOrDefault(event, this._pinEditedNotes, 'pinEditedNotes');
    this._unpinCompletedTodos = await this.getOrDefault(event, this._unpinCompletedTodos, 'unpinCompletedTodos');
    this._unpinBehavior = await this.getOrDefault(event, this._unpinBehavior, 'unpinBehavior');
    this._layoutMode = await this.getOrDefault(event, this._layoutMode, 'layoutMode');
    this._tabHeight = await this.getOrDefault(event, this._tabHeight, 'tabHeight');
    this._minTabWidth = await this.getOrDefault(event, this._minTabWidth, 'minTabWidth');
    this._maxTabWidth = await this.getOrDefault(event, this._maxTabWidth, 'maxTabWidth');
    this._breadcrumbsMinWidth = await this.getOrDefault(event, this._breadcrumbsMinWidth, 'breadcrumbsMinWidth');
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

  /**
   * Check whether or not the handled unpin behavior matches with the setting.
   */
  hasUnpinBehavior(behavior: UnpinBehavior): boolean {
    return (this._unpinBehavior === behavior);
  }

  /**
   * Check whether or not the handled mode matches with the setting.
   */
  hasLayoutMode(mode: LayoutMode): boolean {
    return (this._layoutMode === mode);
  }
}
