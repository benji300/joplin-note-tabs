function getDataId(event) {
  if (event.currentTarget.id === 'tab' || event.currentTarget.className === 'breadcrumb') {
    return event.currentTarget.dataset.id;
  }
  return;
}

/* CLICK EVENTS */
function openFolder(event) {
  const dataId = getDataId(event);
  if (dataId) webviewApi.postMessage({ name: 'tabsOpenFolder', id: dataId });
}

function pinNote(event) {
  const dataId = getDataId(event);
  if (dataId) webviewApi.postMessage({ name: 'tabsPinNote', id: dataId });
}

function tabClick(event) {
  const dataId = getDataId(event);
  if (dataId) {
    if (event.target.id === 'Pin')
      pinNote(event);
    if (event.target.id === 'Unpin')
      webviewApi.postMessage({ name: 'tabsUnpinNote', id: dataId });
    if (event.target.id === 'check')
      webviewApi.postMessage({ name: 'tabsToggleTodo', id: dataId, checked: event.target.checked });

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
let sourceNoteId = "";

function cancelDefault(event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
}

function dragStart(event) {
  const element = event.target;
  element.classList.add("dragging");
  event.dataTransfer.setData("text/plain", element.dataset.id);
  sourceNoteId = element.dataset.id
}

function dragEnd(event) {
  cancelDefault(event);
  const element = event.target;
  element.classList.remove("dragging");
  sourceNoteId = "";
}

function dragOver(event) {
  cancelDefault(event);
  const element = event.target;

  document.querySelectorAll('#tab').forEach(tab => {
    if (tab.dataset.id !== element.dataset.id) {
      tab.classList.remove("dragover");
    }
  });

  if (element.dataset.id !== sourceNoteId) {
    if (element.id === 'tab') {
      element.classList.add("dragover");
    } else if (element.parentElement.id === 'tab') {
      element.parentElement.classList.add("dragover");
    } else if (element.parentElement.parentElement.id === 'tab') {
      element.parentElement.parentElement.classList.add("dragover");
    }
  }
}

function dragLeave(event) {
  cancelDefault(event);
}

function drop(event) {
  cancelDefault(event);
  const targetElement = event.target;
  const sourceId = event.dataTransfer.getData("text/plain");

  if (targetElement && sourceId) {
    if (targetElement.dataset.id !== sourceNoteId) {
      webviewApi.postMessage({
        name: 'tabsDrag',
        targetId: targetElement.dataset.id,
        sourceId: sourceId
      });
      targetElement.classList.remove("dragover");
    }
  }
}
