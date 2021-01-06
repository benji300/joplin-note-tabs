# Joplin Note Tabs

Joplin Note Tabs is a plugin to extend the UX and UI of [Joplin's](https://joplinapp.org/) desktop application.

It allows to open several notes at once in tabs and pin them to be kept open.

> :warning: **CAUTION** - Requires Joplin **v1.5.7** or newer

## Table of contents

- [Features](#features)
  - [Screenshots](#screenshots)
  - [Commands](#Commands)
  - [User options](#user-options)
- [Installation](#installation)
- [Uninstallation](#uninstallation)
- [Feedback](#feedback)
- [Support](#support)
- [Development](#development)
- [Changes](#changes)
- [License](#license)

## Features

- Display selected note as tab
- Pin note(s) to the tabs
- Save pinned tabs permanently
  - Stored in database (not synced with other devices!)
- Remember last opened and unpinned note
- Change position of tabs within the panel
  - Either via drag & drop or keyboard shortcuts (which have been assigned to the corresponding commands)
- Toggle to-do state from tabs
  - Automatically unpin completed to-dos ([configurable](#user-options))
- [Configurable](#user-options) style attributes
- Support horizontal and vertical layout

![screencast](./assets/screencast.gif)

## Screenshots

### Tabs above note content

![tabs-top-horizontal](./assets/tabs-top-horizontal.png)

### Tabs below note content

![tabs-bottom-horizontal](./assets/tabs-bottom-horizontal.png)

> **NOTE** - The used UI theme on this screenshot can be downloaded [here](https://github.com/benji300/joplin-wanaka-ui).

### Tabs beside note content (vertical layout)

![tabs-right-vertical](./assets/tabs-right-vertical.png)

> **NOTE** - The used UI theme on this screenshot can be downloaded [here](https://github.com/benji300/joplin-milford-ui).

### Commands

This plugin provides the commands as described in the following chapters.

- Default keyboard shortcuts can be changed in user options
  - Navigate to `Tools > Options > Keyboard Shortcuts` and search for the command label to be changed

#### Pin to tabs

| Command Label     | Command ID      | Menu                |
| ----------------- | --------------- | ------------------- |
| Tabs: Pin to tabs | `tabsPinToTabs` | `Note list context` |

Pin note(s) to the tabs. Works with multiple selected notes.

#### Pin note

| Command Label  | Command ID    | Menu                               |
| -------------- | ------------- | ---------------------------------- |
| Tabs: Pin note | `tabsPinNote` | `Tools > Tabs`<br>`Editor context` |

Pin the selected note to the tabs.

#### Unpin note

| Command Label    | Command ID      | Menu           |
| ---------------- | --------------- | -------------- |
| Tabs: Unpin note | `tabsUnpinNote` | `Tools > Tabs` |

Unpin the selected note from the tabs.

#### Switch to last active tab

| Command Label                   | Command ID             | Menu           |
| ------------------------------- | ---------------------- | -------------- |
| Tabs: Switch to last active tab | `tabsSwitchLastActive` | `Tools > Tabs` |

Switch to the last active tab, i.e. to previous selected note.

#### Switch tab left

| Command Label            | Command ID       | Menu           |
| ------------------------ | ---------------- | -------------- |
| Tabs: Switch to left tab | `tabsSwitchLeft` | `Tools > Tabs` |

Switch to the left tab next to the active, i.e. select the left note.

#### Switch tab right

| Command Label             | Command ID        | Menu           |
| ------------------------- | ----------------- | -------------- |
| Tabs: Switch to right tab | `tabsSwitchRight` | `Tools > Tabs` |

Switch to the right tab next to the active, i.e. select the right note.

#### Move tab left

| Command Label       | Command ID     | Menu           |
| ------------------- | -------------- | -------------- |
| Tabs: Move tab left | `tabsMoveLeft` | `Tools > Tabs` |

Move active tab one position to the left.

#### Move tab right

| Command Label        | Command ID      | Menu           |
| -------------------- | --------------- | -------------- |
| Tabs: Move tab right | `tabsMoveRight` | `Tools > Tabs` |

Move active tab one position to the right.

#### Remove all pinned tabs

| Command Label                | Command ID  | Menu           |
| ---------------------------- | ----------- | -------------- |
| Tabs: Remove all pinned tabs | `tabsClear` | `Tools > Tabs` |

Remove all pinned tabs. In case no note is selected, the tabs list might be empty afterwards.

### User options

This plugin adds several user options which can be changed via `Tools > Options > Note Tabs`.

> **NOTE** - If `default` is set for an advanced style setting, the corresponding default color, font family, etc. will be used to match the common App look.

> **NOTE** - In case color settings shall be overwritten, they must be specified as valid CSS attribute values, e.g. `#ffffff`, `rgb(255,255,255)`, etc.

## Installation

- Download the latest released JPL package (`joplin-plugin-benji300-tabs.jpl`) from [here](https://github.com/benji300/joplin-note-tabs/releases)
- Open Joplin
- Navigate to `Tools > Options > Plugins`
- Press `Install plugin` and select the previously downloaded `jpl` file
- Confirm selection
- Restart Joplin to enable the plugin

### Place tabs

By default the tabs will be on the right side of the screen, this can be adjusted by:

- `View > Change application layout`
- Use the arrow keys (the displayed ones, not keyboard keys) to move the panel at the desired position
- Move the splitter (between content and tabs panel) up to reach the desired height of the panel
- Press `ESC` to save the layout and return to normal mode

## Uninstallation

- Open Joplin
- Navigate to `Tools > Options > Plugins`
- Search for the `Note Tabs` plugin
- Press `Delete` to remove the plugin from the user profile directory
  - Alternatively you can also disable the plugin by clicking on the toggle button
- Restart Joplin

## Feedback

- :question: Need help?
  - Ask a question on the [Joplin Forum](https://discourse.joplinapp.org/t/plugin-note-tabs/12752)
- :bulb: An idea to improve or enhance the plugin?
  - [Request a new feature](https://github.com/benji300/joplin-note-tabs/issues) or upvote [popular feature requests](https://github.com/benji300/joplin-note-tabs/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement+sort%3Areactions-%2B1-desc+)
- :bug: Found a bug?
  - File an issue on [GitHub](https://github.com/benji300/joplin-note-tabs/issues)

## Support

<form action="https://www.paypal.com/donate" method="post" target="_top">
<input type="hidden" name="hosted_button_id" value="6FHDGK3PTNU22" />
<input type="image" src="https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_DE/i/scr/pixel.gif" width="1" height="1" />
</form>


## Development

### Building the plugin

If you want to build the plugin by your own simply run:

```
npm run dist
```

## Changes

See [CHANGELOG](./CHANGELOG.md) for details.

## License

Copyright (c) 2021 Benjamin Seifert

MIT License. See [LICENSE](./LICENSE) for more information.
