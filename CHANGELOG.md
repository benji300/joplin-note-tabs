# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- User option `Show checklist completion status` to display the completion status of all checklists in the selected note
- Ability to unpin note with middle button click on tab
- Command to pin linked note to tabs
  - Works only if the cursor is inside an internal link to another note in the editor

### Fixed

- Escape html characters from note titles before using them as tab titles
- Removing the tab of a completed but unpinned (temporary) to-do when editing the content of the note
  - Occured only when 'Unpin active tab behavior' was set to a value other than 'Keep selected'

### Removed

- Bundled font packages (FontAwesome, Roboto). Use built-in versions now

## [1.3.0] - 2021-03-09

### Added

- User option `Force tabs layout` to force horizontal or vertical layout mode ([#2](https://github.com/benji300/joplin-note-tabs/issues/2))
- User option `Unpin active tab behavior` to select behavior when unpinning the active tab ([#25](https://github.com/benji300/joplin-note-tabs/issues/25))
- User option `Add tab behavior` to specify type (temporary or pinned) for new tabs ([#35](https://github.com/benji300/joplin-note-tabs/issues/35))
- Ability to scroll tabs and breadcrums horizontally without holding `shift` key ([#34](https://github.com/benji300/joplin-note-tabs/issues/34))

### Changed

- Ensure visibility of active tab, i.e. selected note ([#32](https://github.com/benji300/joplin-note-tabs/issues/32))
- Plugin command labels (Removed `Tabs:` prefix)
- Breadcrumbs and navigation icon styles

### Removed

- User option (`Minimum breadcrumb width`) to specify minimum width of a single breadcrumb

## [1.2.1] - 2021-02-23

### Fixed

- Issue that caused infinite message loop between plugin and app ([#36](https://github.com/benji300/joplin-note-tabs/issues/36))

## [1.2.0] - 2021-02-05

### Added

- User option to specify minimum width for a single breadcrumb entry ([#30](https://github.com/benji300/joplin-note-tabs/issues/30))
- User option to specify the font size for the panel
- User option to specify the background color when hovering over tabs
- User option to display navigation buttons (backward/forward) below the tabs
- Command to toggle panel visibility ([#16](https://github.com/benji300/joplin-note-tabs/issues/16))
- Support to drag & drop notes from note list to pin as tabs ([#31](https://github.com/benji300/joplin-note-tabs/issues/31))
- Support to drag & drop notes from [favorites plugin](https://github.com/benji300/joplin-favorites) to pin as tabs

### Changed

- Breadcrumbs scroll independently from tabs ([#29](https://github.com/benji300/joplin-note-tabs/issues/29))
- Improved reading and updating values from plugin settings ([#24](https://github.com/benji300/joplin-note-tabs/issues/24))

## [1.1.1] - 2021-01-12

### Changed

- Renamed `jpl` package to `joplin.plugin.note.tabs` respectively `joplin-plugin-note-tabs` for npm
  - Neccessary due to npmjs package naming restrictions

## [1.1.0] - 2021-01-12

### Added

- Option `Show breadcrumbs below tabs` to show full breadcrumbs for selected note below tabs ([#17](https://github.com/benji300/joplin-note-tabs/issues/17))

### Changed

- Consider Option `View > Show completed to-dos` to display completed to-dos on tabs only if enabled ([#15](https://github.com/benji300/joplin-note-tabs/issues/15))
- Removed `tabsPinToTabs` command. `tabsPinNote` can now be used from context menu and command palette
- `tabsUnpinNote` command to work also with multiple selected notes

## [1.0.0] - 2021-01-06

### Added

- User option to specify the font family for the plugin
  - Including integrated Roboto font-face
- User option to disable to-do checkboxes on tabs ([#6](https://github.com/benji300/joplin-note-tabs/issues/6))
- User option to automatically pin notes when edited ([#11](https://github.com/benji300/joplin-note-tabs/issues/11))
- Commands to switch between tabs ([#5](https://github.com/benji300/joplin-note-tabs/issues/5))
- Command to switch to last active tab ([#8](https://github.com/benji300/joplin-note-tabs/issues/8))
- Ability to pin note(s) from note list context menu ([#12](https://github.com/benji300/joplin-note-tabs/pull/12))
- Ability to pin note from editor context menu ([#9](https://github.com/benji300/joplin-note-tabs/pull/9) by [@ambrt](https://github.com/ambrt))
- Ability to pin note with double click on tab
- Ability to rearrange tabs by drag & drop ([#3](https://github.com/benji300/joplin-note-tabs/pull/3))
  - Can be deactivated via user option
- Ability to move unpinned tabs
- Description to place tabs to README ([#4](https://github.com/benji300/joplin-note-tabs/pull/4) by [@amandamcg](https://github.com/amandamcg))

### Changed

- Decreased jpl size
- Default value of advanced style settings is now `default` for all
- Change package name to `joplin-plugin-benji300-tabs` to follow new naming conventions for plugins
  - Which allows to find published plugins on npm

## [0.1.0] - 2020-11-28

- Initial Release
