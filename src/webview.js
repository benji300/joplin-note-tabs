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

function dragStart(event) {
  const dataId = getDataId(event);
  if (dataId) {
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.setData('text/x-plugin-note-tabs-id', dataId);
    sourceId = dataId;
  }
}

function dragEnd(event, hoverColor) {
  cancelDefault(event);
  event.currentTarget.classList.remove('dragging');
  document.querySelectorAll('#tab').forEach(x => {
    if (x.style.background === hoverColor)
      x.style.background = 'none';
  });
  sourceId = '';
}

function dragOver(event, hoverColor) {
  cancelDefault(event);
  if (sourceId) {
    const dataId = getDataId(event);
    if (dataId) {
      document.querySelectorAll('#tab').forEach(x => {
        if (x.style.background === hoverColor)
          x.style.background = 'none';
      });

      if (sourceId !== dataId)
        event.currentTarget.style.background = hoverColor;
    }
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);
  const dataSourceId = event.dataTransfer.getData('text/x-plugin-note-tabs-id');
  if (dataSourceId) {
    const dataTargetId = getDataId(event);
    if (dataTargetId !== sourceId)
      webviewApi.postMessage({ name: 'tabsDrag', targetId: dataTargetId, sourceId: dataSourceId });
  }
}
