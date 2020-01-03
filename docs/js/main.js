import { Visualizer } from './components/index.js';

const ratio = (n) => {
	return (n/595001) * 16;
}


const init = () => {
	const visualizer = new Visualizer({
		domTarget: document.getElementById('canvasContainer'),
		populateRandomData: false,
	});


	visualizer.addCube(172, ratio(167987), 1)
	visualizer.addCube(179, ratio(49033), 1)
	visualizer.addCube(155, ratio(595001), 1)
	visualizer.addCube(139, ratio(1182), 1)
	visualizer.addCube(210, ratio(474), 1)
	visualizer.addCube(240, ratio(870), 1)
	visualizer.addCube(151, ratio(16361), 1)
	visualizer.addCube(114, ratio(4148), 1)
	visualizer.addCube(187, ratio(312), 1)
	visualizer.addCube(135, ratio(202), 1)
}

document.addEventListener('DOMContentLoaded', init);