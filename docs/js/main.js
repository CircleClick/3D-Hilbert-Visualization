let renderer, scene, camera, material, group, grid, orbitX = 0.785, orbitY = -0.87;

const lineMaterial = new THREE.LineBasicMaterial({
	color: 0x222222,
	linewidth: 1,
	linecap: 'round', //ignored by WebGLRenderer
	linejoin: 'round' //ignored by WebGLRenderer
});
const textMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });

const gridSize = 16;

import { Grid } from './components/index.js';
import { gridAlign, makeCube, scaleCube, shadowCube } from './utils/index.js';

const resize = () => {
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix()
}

const draw = () => {
	requestAnimationFrame(draw);

    /*while (orbitX > 360) orbitX -= 360;
	while (orbitX < 0) orbitX += 360;*/

	/*
	camera.position.z = (gridSize * 1.3) * Math.cos(orbitX);
	camera.position.x = (gridSize * 1.3) * Math.sin(orbitX);
	camera.position.y = (gridSize * 0.5);

	camera.rotation.y = orbitX;
	*/

	//camera.position.x = (gridSize * 1.3);
	camera.position.y = (gridSize * 0.25);
	camera.position.z = (gridSize * 1.5);

	group.rotation.y = orbitX;
	group.rotation.x = -orbitY / 2;

	renderer.render(scene, camera);
}

const init = () => {
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, gridSize * 3);

	group = new THREE.Group();

	scene = new THREE.Scene();
	scene.add(group);
	scene.background = new THREE.Color('#FFFFFF');

	grid = new Grid({ size: gridSize, divisions: gridSize });
	group.add(grid.group)

	/*const loader = new THREE.FontLoader();
	loader.load('js/utils/open-sans.json', (font) => {
		const yDataGroup = new THREE.Group();
		const yDataOutline = new THREE.GridHelper(
			gridSize,
			1,
			0x222222,
			0x222222);
		yDataOutline.scale.x = 0.5;

		const text_geometry = new THREE.TextBufferGeometry(`Test`, {
			font: font,
			size: gridSize/8,
			height: 0,
		});
		const text = new THREE.Mesh(text_geometry, new THREE.MeshBasicMaterial({ color: 0x444444 }));
		text.rotation.x = -Math.PI/2;
		text.position.x = -gridSize/4;
		text.position.z = -gridSize/4;
		yDataGroup.add(text);

		yDataGroup.position.z = -gridSize / 2;
		yDataGroup.position.y = gridSize / 2;
		yDataGroup.position.x = -gridSize / 4;
		yDataGroup.rotation.x = Math.PI / 2
		yDataGroup.add(yDataOutline);
		group.add(yDataGroup);
	});*/

	/*for (let n = 0; n < gridSize * gridSize; n++) {
		const cube = makeCube(gridSize, n);
		cube.data = {
			distance: n,
		}
		cube.position.y += Math.floor(n / gridSize);
		group.add(cube);
	}*/
	

	for (let index = 0; index < 10; index++) {
		const coord = Math.floor(Math.random()*(gridSize*gridSize))
		const height = Math.random() * gridSize;
		let scale = Math.floor(Math.random() * 5);

		if (scale > 1 && Math.random() > 0.5) scale -= 1;
		if (scale > 1 && Math.random() > 0.5) scale -= 1;

		const cube = makeCube(gridSize, coord);
		scaleCube(cube, scale)
		cube.position.y += height;
		group.add(cube);
		const cubeShadow = shadowCube(gridSize, coord, height, scale);
		group.add(cubeShadow);
		
	}
	
	


	renderer = new THREE.WebGLRenderer({ antialias: true });

	resize();
	window.addEventListener('resize', resize);
	document.body.appendChild(renderer.domElement);
	draw();
}

let click_startX = 0;
let click_startY = 0;
let startOrbitY = orbitY;
let startorbitX = orbitX;
let click_active = false;
window.addEventListener('mousedown', (e) => {
	click_startX = e.clientX;
	click_startY = e.clientY;
	startOrbitY = orbitY;
	startorbitX = orbitX;
	click_active = true;
})
window.addEventListener('mouseup', (e) => {
	click_active = false;
})
window.addEventListener('mousemove', (e) => {
	if (click_active) {
		orbitX = startorbitX - (e.clientX - click_startX) / 200;
		orbitY = startOrbitY - (e.clientY - click_startY) / 100;
	}
})

document.addEventListener('DOMContentLoaded', init);