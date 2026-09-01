let sourceId = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function getDataId(event) {
  if (event.currentTarget.id === 'tab' || event.currentTarget.className === 'breadcrumb') {
    return event.currentTarget.dataset.id;
  } else {
    return;
  }
}

/* EVENT HANDLER */

function message(message) {
  webviewApi.postMessage({ name: message });
}

function openFolder(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'tabsOpenFolder', id: dataId });
  }
}

function pinNote(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'tabsPinNote', id: dataId });
  }
}

function unpinNote(event) {
  const dataId = getDataId(event);
  if (dataId) {
    webviewApi.postMessage({ name: 'tabsUnpinNote', id: dataId });
  }
}

// default click handler
function tabClick(event) {
  const dataId = getDataId(event);
  if (dataId) {
    if (event.target.id === 'Pin') {
      pinNote(event);
    } else if (event.target.id === 'Unpin') {
      unpinNote(event);
    } else if (event.target.id === 'check') {
      webviewApi.postMessage({ name: 'tabsToggleTodo', id: dataId, checked: event.target.checked });
    } else {
      webviewApi.postMessage({ name: 'tabsOpen', id: dataId });
    }
  }
}

function onAuxClick(event) {
  cancelDefault(event);
  // middle button clicked
  if (event.button == 1) {
    unpinNote(event);
  }
}

// preserve scroll position across setHtml() re-renders, only auto-scrolling
// the active tab into view when it isn't already visible.
// #container scrolls vertically (vertical layout mode), #tabs-container
// scrolls horizontally (default layout mode) - track both.
const SCROLLABLE_IDS = ['container', 'tabs-container'];
const savedScroll = {};

document.addEventListener('scroll', (event) => {
  const id = event.target && event.target.id;
  if (SCROLLABLE_IDS.includes(id)) {
    savedScroll[id] = { top: event.target.scrollTop, left: event.target.scrollLeft };
  }
}, true);

function isTabVisible(tab, container) {
  const tabRect = tab.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return tabRect.top >= containerRect.top && tabRect.bottom <= containerRect.bottom &&
    tabRect.left >= containerRect.left && tabRect.right <= containerRect.right;
}

// walk up from the tab to find whichever ancestor is actually clipping/
// scrolling it - which element that is depends on layout mode (default vs
// vertical) and shouldn't be hardcoded
function getScrollParent(el) {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(style.overflowY) || /(auto|scroll|overlay)/.test(style.overflowX)) {
      return node;
    }
    node = node.parentElement;
  }
  return document.body;
}

const tabsObserver = new MutationObserver(() => {
  for (const id of SCROLLABLE_IDS) {
    const element = document.getElementById(id);
    const pos = savedScroll[id];
    if (element && pos) {
      element.scrollTop = pos.top;
      element.scrollLeft = pos.left;
    }
  }

  const activeTab = document.querySelector("div#tab[active]");
  if (activeTab) {
    const viewport = getScrollParent(activeTab);
    if (!isTabVisible(activeTab, viewport)) {
      activeTab.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
});
// document.body is stable across setHtml() calls - Joplin only replaces the
// innerHTML of a nested content div, so observing body catches every update.
tabsObserver.observe(document.body, { childList: true, subtree: true });

// scroll horizontally without 'shift' key
document.addEventListener('wheel', (event) => {
  let element;
  const path = event.composedPath();
  if (path.findIndex(x => x.id === 'tabs-container') >= 0) {
    element = document.getElementById('tabs-container');
  } else if (path.findIndex(x => x.id === 'breadcrumbs-container') >= 0) {
    element = document.getElementById('breadcrumbs-container');
  }
  // only in play when the element actually has horizontal overflow to
  // scroll through (e.g. not in vertical layout mode, where tabs-container
  // scrolls vertically on its own and this hack would otherwise fight it)
  if (element && element.scrollWidth > element.clientWidth) {
    element.scrollLeft -= (-event.deltaY);
  }
});

/* DRAG AND DROP */

function setBackground(event, background) {
  event.currentTarget.style.background = background;
}

function resetBackground(element) {
  if (element.dataset.bg) {
    element.style.background = element.dataset.bg;
  } else {
    element.style.background = 'none';
  }
}

function resetTabBackgrounds() {
  document.querySelectorAll('#tab').forEach(x => { resetBackground(x); });

  container = document.querySelector('#tabs-container');
  if (container) {
    container.style.background = 'none';
  }
}

function dragStart(event) {
  const dataId = getDataId(event);
  if (dataId) {
    event.dataTransfer.setData('text/x-plugin-note-tabs-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  sourceId = '';
}

function dragOver(event, hoverColor) {
  resetTabBackgrounds();
  cancelDefault(event);
  if (sourceId !== getDataId(event)) {
    setBackground(event, hoverColor);
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  resetTabBackgrounds();
  cancelDefault(event);
  const dataTargetId = getDataId(event);

  // check whether plugin tab was dragged - trigger tabsDrag message
  const noteTabsId = event.dataTransfer.getData('text/x-plugin-note-tabs-id');
  if (noteTabsId) {
    if (dataTargetId !== sourceId) {
      webviewApi.postMessage({ name: 'tabsDrag', targetId: dataTargetId, sourceId: noteTabsId });
      return;
    }
  }

  // check whether note was dragged from app onto the panel - add new tab at dropped index
  const joplinNoteIds = event.dataTransfer.getData('text/x-jop-note-ids');
  if (joplinNoteIds) {
    const noteIds = new Array();
    for (const noteId of JSON.parse(joplinNoteIds)) {
      noteIds.push(noteId);
    }
    webviewApi.postMessage({ name: 'tabsDragNotes', noteIds: noteIds, targetId: dataTargetId });
    return;
  }

  // check whether favorite (from joplin.plugin.benji.favorites plugin) was dragged onto the panel - add new tab at dropped index
  const favoritesId = event.dataTransfer.getData('text/x-plugin-favorites-id');
  if (favoritesId) {
    const noteIds = new Array(favoritesId);
    webviewApi.postMessage({ name: 'tabsDragNotes', noteIds: noteIds, targetId: dataTargetId });
    return;
  }
}
