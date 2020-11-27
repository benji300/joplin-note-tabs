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
		console.info('tabsPin: ' + id);
		webviewApi.postMessage({
			name: 'tabsPin',
			id: element.dataset.id,
		});
	}
	if (element.id === 'Unpin') {
		const id = element.dataset.id;
		console.info('tabsUnpin: ' + id);
		webviewApi.postMessage({
			name: 'tabsUnpin',
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