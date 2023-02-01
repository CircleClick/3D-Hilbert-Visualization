import * as THREE from "three";
import { Grid } from './index.js';
import { gridAlign, makeCube, scaleCube, shadowCube } from '../utils/index.js';

export class Visualizer {
	constructor(options = {}) {
		this.options = Object.assign({
			domTarget: document.body,
			enableOrbitControls: true,
			populateRandomData: false,
			gridSize: 65536,
		}, options)

		if (this.options.enableOrbitControls) this.initiateOrbitControls();

		this.elements = [];
		
		this.group = new THREE.Group();

		this.scene = this.options.scene;
		this.scene.add(this.group);
		this.scene.background = new THREE.Color('#FFFFFF');

		const grid = Grid({
			size: this.options.gridSize,
			divisions: this.options.gridSize,
		});
		this.group.add(grid);

		if (this.options.populateRandomData) this.populateRandomData();
	}


	draw() {
		this.group.rotation.y = -this.orbitControls.orbitX;
		this.group.rotation.x = -this.orbitControls.orbitY / 2;
	}


	populateRandomData() {
		for (let index = 0; index < 10; index++) {
			const coord = Math.floor(Math.random() * (this.options.gridSize * this.options.gridSize));
			const height = Math.random() * this.options.gridSize;
			let scale = Math.floor(Math.random() * 5);

			if (scale > 1 && Math.random() > 0.5) scale -= 1;
			if (scale > 1 && Math.random() > 0.5) scale -= 1;

			this.addCube(coord, height, scale);
		}
	}

	addCube(distance = 1, height = 1, scale = 1) {
		const coord = distance;

		const cube = makeCube(this.options.gridSize, coord);
		scaleCube(cube, scale);
		cube.position.y += height;
		this.group.add(cube);
		if (height > 1) {
			const cubeShadow = shadowCube(this.options.gridSize, coord, height, scale);
			this.group.add(cubeShadow);
		}
	}

	initiateOrbitControls() {

		this.orbitControls = {
			click_startX: 0,
			click_startY: 0,
			orbitX: -0.785,
			orbitY: -0.87,
			startorbitX: -0.785,
			startOrbitY: -0.87,
			click_active: false,
		};
		window.addEventListener('mousedown', (e) => {
			this.orbitControls.click_startX = e.clientX;
			this.orbitControls.click_startY = e.clientY;
			this.orbitControls.startOrbitY = this.orbitControls.orbitY;
			this.orbitControls.startorbitX = this.orbitControls.orbitX;
			this.orbitControls.click_active = true;
		})

		window.addEventListener('mouseup', (e) => {
			this.orbitControls.click_active = false;
		})
		window.addEventListener('mouseleave', (e) => {
			this.orbitControls.click_active = false;
		})

		window.addEventListener('mousemove', (e) => {
			if (this.orbitControls.click_active) {
				this.orbitControls.orbitX = this.orbitControls.startorbitX - (e.clientX - this.orbitControls.click_startX) / 200;
				this.orbitControls.orbitY = this.orbitControls.startOrbitY - (e.clientY - this.orbitControls.click_startY) / 100;
			}
		})
	}
}
