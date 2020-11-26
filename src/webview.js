document.addEventListener('click', event => {
	const element = event.target;
	if (element.className === 'tab-inner' || element.className === 'title') {
		const id = element.dataset.id;
		console.info('Open note: ' + id);
		webviewApi.postMessage({
			name: 'openNote',
			id: element.dataset.id,
		});
	}
	if (element.className === 'fas fa-times') {
		const id = element.dataset.id;
		console.info('Unpin note: ' + id);
		webviewApi.postMessage({
			name: 'unpinNote',
			id: element.dataset.id,
		});
	}
	if (element.className === 'fas fa-thumbtack') {
		const id = element.dataset.id;
		console.info('Pin note: ' + id);
		webviewApi.postMessage({
			name: 'pinNote',
			id: element.dataset.id,
		});
	}
})