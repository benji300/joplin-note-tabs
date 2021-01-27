function getDataId(event) {
  if (event.currentTarget.id === 'tab' || event.currentTarget.className === 'breadcrumb')
    return event.currentTarget.dataset.id;
  else
    return;
}

/* CLICK EVENTS */
function openFolder(event) {
  const dataId = getDataId(event);
  if (dataId)
    webviewApi.postMessage({ name: 'tabsOpenFolder', id: dataId });
}

function pinNote(event) {
  const dataId = getDataId(event);
  if (dataId)
    webviewApi.postMessage({ name: 'tabsPinNote', id: dataId });
}

function tabClick(event) {
  const dataId = getDataId(event);
  if (dataId) {
    if (event.target.id === 'Pin')
      pinNote(event);
    else if (event.target.id === 'Unpin')
      webviewApi.postMessage({ name: 'tabsUnpinNote', id: dataId });
    else if (event.target.id === 'check')
      webviewApi.postMessage({ name: 'tabsToggleTodo', id: dataId, checked: event.target.checked });
    else
      webviewApi.postMessage({ name: 'tabsOpen', id: dataId });
  }
}

function moveLeft() {
  webviewApi.postMessage({ name: 'tabsMoveLeft' });
}

function moveRight() {
  webviewApi.postMessage({ name: 'tabsMoveRight' });
}

/* DRAG AND DROP */
let sourceId = '';

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function setBackground(event, background) {
  event.currentTarget.style.background = background;
}

function resetBackground(element) {
  if (element.dataset.bg)
    element.style.background = element.dataset.bg;
}

function resetTabBackgrounds() {
  document.querySelectorAll('#tab').forEach(x => { resetBackground(x); });
  tabsContainer = document.querySelector('#tabs-container');
  if (tabsContainer)
    tabsContainer.style.background = 'none';
}

function dragStart(event) {
  const dataId = getDataId(event);
  if (dataId) {
    event.dataTransfer.setData('text/x-plugin-note-tabs-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event) {
  cancelDefault(event);
  resetTabBackgrounds();
  sourceId = '';
}

function dragOver(event, hoverColor) {
  cancelDefault(event);
  resetTabBackgrounds();
  if (sourceId !== getDataId(event))
    setBackground(event, hoverColor);
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);
  const dataTargetId = getDataId(event);

  // check whether plugin tab was dragged - trigger tabsDrag message
  const dataSourceId = event.dataTransfer.getData('text/x-plugin-note-tabs-id');
  if (dataSourceId) {
    if (dataTargetId !== sourceId) {
      webviewApi.postMessage({ name: 'tabsDrag', targetId: dataTargetId, sourceId: dataSourceId });
      return;
    }
  }

  // check whether note was dragged from app onto the panel - add new tab at dropped index
  const appDragNoteIds = event.dataTransfer.getData('text/x-jop-note-ids');
  if (appDragNoteIds) {
    const noteIds = new Array();
    for (const noteId of JSON.parse(appDragNoteIds)) {
      noteIds.push(noteId);
    }
    webviewApi.postMessage({ name: 'tabsDragNotes', noteIds: noteIds, targetId: dataTargetId });
    return;
  }
}
