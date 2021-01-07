# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
