document.addEventListener('click', event => {
	const element = event.target;

	if (element.className === 'tab-inner' || element.className === 'title') {
		const id = element.dataset.id;
		console.info('tabsOpen: ' + id);
		webviewApi.postMessage({
			name: 'tabsOpen',
			id: element.dataset.id,
		});
	}
	if (element.id === 'Pin') {
		const id = element.dataset.id;
		console.info('tabsPinNote: ' + id);
		webviewApi.postMessage({
			name: 'tabsPinNote',
			id: element.dataset.id,
		});
	}
	if (element.id === 'Unpin') {
		const id = element.dataset.id;
		console.info('tabsUnpinNote: ' + id);
		webviewApi.postMessage({
			name: 'tabsUnpinNote',
			id: element.dataset.id,
		});
	}
	if (element.id === 'check') {
		const id = element.dataset.id;
		console.info('tabsToggleTodo: ' + id);
		webviewApi.postMessage({
			name: 'tabsToggleTodo',
			id: element.dataset.id,
		});
	}
	if (element.id === 'moveTabLeft') {
		console.info('tabsMoveLeft');
		webviewApi.postMessage({
			name: 'tabsMoveLeft'
		});
	}
	if (element.id === 'moveTabRight') {
		console.info('tabsMoveRight');
		webviewApi.postMessage({
			name: 'tabsMoveRight'
		});
	}
})