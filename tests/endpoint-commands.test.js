const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

async function startPlugin(ids, selectedId) {
  const commands = new Map();
  const opened = [];
  let start;
  let menu;
  class NoteTabs {
    get length() { return ids.length; }
    get(index) { return { id: ids[index] }; }
  }
  class Settings { async register() {} }
  class Panel {
    async register() {}
    async updateWebview() {}
  }
  const joplin = {
    plugins: { register: (plugin) => { start = plugin.onStart; } },
    commands: {
      register: async (command) => commands.set(command.name, command),
      execute: async (name, id) => { opened.push([name, id]); },
    },
    data: {},
    settings: { onChange() {} },
    workspace: {
      selectedNote: async () => selectedId ? { id: selectedId } : null,
      onNoteSelectionChange() {},
      onNoteChange() {},
      onSyncComplete() {},
    },
    views: {
      dialogs: {},
      menus: { create: async (_id, _label, items) => { menu = items; } },
      menuItems: { create: async () => {} },
    },
  };
  const modules = {
    api: { default: joplin },
    'api/types': { MenuItemLocation: {} },
    './noteTabs': { NoteTabs },
    './lastActiveNote': { LastActiveNote: class {} },
    './settings': { Settings },
    './panel': { Panel },
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/index.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports: {},
    require: (name) => {
      assert.ok(name in modules, `Unexpected import: ${name}`);
      return modules[name];
    },
  });
  await start();
  return { commands, opened, menu };
}

for (const [endpoint, target] of [['First', 'a'], ['Last', 'd']]) {
  test(`${endpoint}: opens only the endpoint, skipping intermediate notes`, async () => {
    const plugin = await startPlugin(['a', 'b', 'c', 'd'], 'c');
    await plugin.commands.get(`tabsSwitch${endpoint}`).execute();
    assert.deepEqual(plugin.opened, [['openNote', target]]);
    assert.ok(plugin.menu.some(item => item.commandName === `tabsSwitch${endpoint}`));
  });

  test(`${endpoint}: does not reopen the active endpoint`, async () => {
    const plugin = await startPlugin(['a', 'b', 'c', 'd'], target);
    await plugin.commands.get(`tabsSwitch${endpoint}`).execute();
    assert.deepEqual(plugin.opened, []);
  });

  for (const [label, ids, selected] of [
    ['empty tabs', [], 'a'],
    ['one active tab', ['a'], 'a'],
    ['no selected note', ['a', 'b'], null],
  ]) {
    test(`${endpoint}: safely handles ${label}`, async () => {
      const plugin = await startPlugin(ids, selected);
      await plugin.commands.get(`tabsSwitch${endpoint}`).execute();
      assert.deepEqual(plugin.opened, []);
    });
  }
}

test('endpoints follow the current tab order', async () => {
  const plugin = await startPlugin(['d', 'b', 'a'], 'b');
  await plugin.commands.get('tabsSwitchFirst').execute();
  await plugin.commands.get('tabsSwitchLast').execute();
  assert.deepEqual(plugin.opened, [['openNote', 'd'], ['openNote', 'a']]);
});
