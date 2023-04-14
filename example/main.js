import './style.css'

import HilbertVisualizer from '../index.js';

const visualizer = new HilbertVisualizer({
	hilbertSize: 10,
});
document.body.appendChild(visualizer.renderer.domElement);


visualizer.spawnHilbertMesh(0, 20, 0, 3, 0xc92a3d);
visualizer.spawnHilbertMesh(21, 39, 0, 2, 0xf1a239);
visualizer.spawnHilbertMesh(40, 48, 0, 3, 0x3ca7db);

//add some elements underneath the floor
visualizer.spawnHilbertMesh(0, 255, -1, 0, 0x3d6be0);
visualizer.spawnHilbertMesh(256, 256 * 2 - 1, -1, 0, 0xf1a239);
visualizer.spawnHilbertMesh(256 * 2, 256 * 3 - 1, -1, 0, 0xc92a3d);
visualizer.spawnHilbertMesh(256 * 3, 256 * 4 - 1, -1, 0, 0x3ca7db);

//add a white cube near the center
//show click event functionality
visualizer.spawnHilbertMesh(170, 170, 0, 1, 0xffffff, {
	onclick: (e) => {
		alert('You clicked the white cube!');
	}
});

//move the camera to the white cube
visualizer.moveCameraToHilbert(170, 10)



//show that you can spawn, remove and spawn again
const maxRange = Math.pow(2, visualizer.options.hilbertSize) - 1;
let randomMesh = null;
setInterval(() => {
	const a = Math.floor(Math.random() * maxRange);
	const b = a + Math.floor(Math.random() * 32);

	const start = Math.min(a, b);
	const end = Math.max(a, b);

	if (randomMesh) {
		visualizer.removeMesh(randomMesh);
	}

	randomMesh = visualizer.spawnHilbertMesh(start, end, 10, 11, 0xffffff);
}, 2500);