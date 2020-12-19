const menu = document.querySelector(".context");
let menuVisible = false;

document.addEventListener('click', event => {
	const element = event.target;

	if(menuVisible)toggleMenu("hide");

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

const toggleMenu = command => {
	const menu = document.querySelector(".context");
  menu.style.display = command === "show" ? "block" : "none";
  menuVisible = !menuVisible;
};

document.addEventListener("contextmenu", e => {
	e.preventDefault();
	const menu = document.querySelector(".context");
  menu.style.left = `${e.pageX}px`;
  menu.style.top = `${e.pageY}px`;
  toggleMenu("show");
  return false;
});