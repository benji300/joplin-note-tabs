document.addEventListener('dblclick', event => {
	const element = event.target;

	if (element.id === 'tab' || element.className === 'tab-inner' || element.className === 'title') {
		webviewApi.postMessage({
			name: 'tabsPinNote',
			id: element.dataset.id,
		});
	}
})

document.addEventListener('click', event => {
	const element = event.target;

	if (element.id === 'tab' || element.className === 'tab-inner' || element.className === 'title') {
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
