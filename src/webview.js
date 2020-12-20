document.addEventListener('dblclick', event => {
	const element = event.target;

	if (element.className === 'tab-inner' || element.className === 'title') {
		webviewApi.postMessage({
			name: 'tabsPinNote',
			id: element.dataset.id,
		});
	}
})

document.addEventListener('click', event => {
	const element = event.target;

	if (element.className === 'tab-inner' || element.className === 'title') {
		webviewApi.postMessage({
			name: 'tabsOpen',
			id: element.dataset.id,
		});
	}
	if (element.id === 'Pin') {
		webviewApi.postMessage({
			name: 'tabsPinNote',
			id: element.dataset.id,
		});
	}
	if (element.id === 'Unpin') {
		webviewApi.postMessage({
			name: 'tabsUnpinNote',
			id: element.dataset.id,
		});
	}
	if (element.id === 'check') {
		webviewApi.postMessage({
			name: 'tabsToggleTodo',
			id: element.dataset.id,
			checked: element.checked
		});
	}
	if (element.id === 'moveTabLeft') {
		webviewApi.postMessage({
			name: 'tabsMoveLeft'
		});
	}
	if (element.id === 'moveTabRight') {
		webviewApi.postMessage({
			name: 'tabsMoveRight'
		});
	}
})

/* DRAG AND DROP */
function cancelDefault(event) {
	event.preventDefault();
	event.stopPropagation();
	return false;
}

function dragStart(event) {
	const element = event.target;
	element.classList.add("dragging");
	event.dataTransfer.setData("text/plain", element.dataset.id);
}

function dragEnd(event) {
	const element = event.target;
	element.classList.remove("dragging");
}

function dragOver(event) {
	cancelDefault(event);
	const element = event.target;
	element.classList.add("dragover");
}

function dragLeave(event) {
	const element = event.target;
	element.classList.remove("dragover");
}

function drop(event) {
	cancelDefault(event);
	const dragOverElement = event.target;
	const draggedTabId = event.dataTransfer.getData("text/plain");

	if (dragOverElement && draggedTabId) {
		webviewApi.postMessage({
			name: 'tabsDrag',
			dragOverId: dragOverElement.dataset.id,
			draggedId: draggedTabId
		});
		dragOverElement.classList.remove("dragover");
	}
}
