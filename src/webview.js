document.addEventListener('click', event => {
	const element = event.target;
	if (element.className === 'bp-link') {
		webviewApi.postMessage({
			name: 'scrollToHash',
			hash: element.dataset.slug,
		});
	}
})