# Joplin Note Tabs

This is a plugin to extend the UX and UI of [Joplin's](https://joplinapp.org/) desktop application.

> TODO - describe what it does "It..."

> :warning: **CAUTION** - Requires Joplin **v1.4.11** or newer

## Table of contents

- [Features](#features)
  - [New commands](#new-commands)
  - [UI enhancements](#ui-enhancements)
  - [User options](#user-options)
- [Installation](#installation)
- [Uninstallation](#uninstallation)
- [UI tweaks](#ui-tweaks)
- [Feedback](#feedback)
- [Development](#development)
- [Changes](#changes)
- [License](#license)

## Features

> TODO - Describe features in general here...

### New commands

This plugin provides the commands as described in the following chapters.

- Column `Additional UI Locations` describes where the command can additionally be added to the UI
  - Whether the command is displayed or not can be set in the [user options](#user-options)
- Default keyboard shortcuts can be changed in user options
  - Navigate to `Tools > Options > Keyboard Shortcuts` and search for the command label to be changed

> TODO - Add commands here... Example:

#### Add new Note (`addNewNote`)

| Command Label | Command ID   | Default Key         | Menu   | Additional UI Locations       |
| ------------- | ------------ | ------------------- | ------ | ----------------------------- |
| Add new note  | `addNewNote` | `CmdOrCtrl+Shift+N` | `Note` | Note context,<br>Note toolbar |

Adds a new note to the active notebook.

> **NOTE** - Something noteworthy...

### UI enhancements

This plugin adds the following elements to the UI.

To get the best result, check out the [UI tweaks](#ui-tweaks) also.

> TODO - describe additions to the UI (with screenshots, if available)
> New panels, views, dialogs, ... in sub-chapters
> Otherwise remove chapters

#### Menus

> TODO - Add menu entries here... Example:

- Add context menu entry for `Add new Note` command

#### Panels/Views/etc.

> TODO - Add panel/view descriptions here...

### User options

This plugin adds the following user options which can be accessed via `Tools > Options > %PLUGIN-NAME%`.

> **NOTE** - Changes to the user options are only applied after a restart of the app

> TODO - Add user options here... Example:

- Show [Add new note](#add-new-note) on note toolbar:\
  _Select whether a button for the command shall be shown on the note toolbar (next to note title) or not_

## Installation

- Download the latest released JPL package (`com.benji300.joplin.tabs.jpl`) from [here](https://github.com/benji300/joplin-note-tabs/releases)
- Open Joplin
- Navigate to `Tools > Options > Plugins`
- Click `Install plugin` and select the previously downloaded `jpl` file
- Confirm selection
- Restart Joplin to enable the plugin

## Uninstallation

- Open Joplin
- Navigate to `Tools > Options > Plugins`
- Search for the `Command Extension` plugin
- Click `Delete` to remove the plugin from the user profile directory
  - Alternatively you can also disable the plugin by clicking on the toggle button
- Restart Joplin

## UI tweaks

> TODO - describe how to change `webview.css` or `userchrome.css` (if available)\
> E.g. to not show something which is displayed elsewhere via the new plugin.\
> Otherwise remove chapters

### Plugin styles

- Open Joplin and navigate to `Help > Open user profile directory`
- In the opened file explorer navigate to the plugin folder (`/plugins/%plugin-name%`)
- Search for `webview.css` (should be content of subfolder `/dist`) and open it with any text editor
- Follow the steps below

> TODO Add steps here...

### General App styles

- Open Joplin and navigate to `Joplin > Preferences > Appearances`
- Click `Advanced Settings`
- Click `Custom stylesheet for Joplin-wide app styles` to open `userchrome.css` in any text editor
- Follow the steps below

> TODO Add steps here...

## Feedback

If you need help or found a bug, open an issue on [GitHub](https://github.com/benji300/joplin-note-tabs/issues).

## Development

### Building the plugin

If you want to build the plugin by your own simply run:

```
npm run dist
```

Or run to create also the archives:

```
npm run release
```

## Changes

See [CHANGELOG](./CHANGELOG.md) for details.

## License

Copyright (c) 2020 Benjamin Seifert

MIT License. See [LICENSE](./LICENSE) for more information.
