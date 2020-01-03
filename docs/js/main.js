import { Visualizer } from './components/index.js';

const init = () => {
	const visualizer = new Visualizer({
		domTarget: document.getElementById('canvasContainer'),
	});


}

document.addEventListener('DOMContentLoaded', init);