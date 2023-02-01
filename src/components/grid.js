import * as THREE from "three";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

const gridDefaults = {
	size: 65536,
	divisions: 65536,
	colorCenterLine: 0x000000,
	colorGrid: 0xAAAAAA,
	textColor: 0x444444,
	number: true,
}

import { distance2Point } from '../utils/hilbert.js';

// new grid function
export function Grid(opts = {}) {
	const gridOptions = Object.assign({}, gridDefaults);
	Object.assign(gridOptions, opts);

	const group = new THREE.Group();
	const grid = new THREE.GridHelper(
		gridOptions.size,
		gridOptions.divisions,
		gridOptions.colorCenterLine,
		gridOptions.colorGrid
	);
	group.add(grid);

	const loader = new FontLoader();
	loader.load('/open-sans.json', (font) => {
		if (gridOptions.number && gridOptions.divisions <= 32) {
			const target = gridOptions.divisions * gridOptions.divisions;
			const ratio = gridOptions.size / gridOptions.divisions;

			for (let index = 0; index < target; index++) {
				const xy = distance2Point(index);

				const text_geometry = new TextGeometry(`${index}`, {
					font: font,
					size: (gridOptions.size / gridOptions.divisions) / 3.5,
					height: 0,
				});

				const text = new THREE.Mesh(text_geometry, new THREE.MeshBasicMaterial({ color: gridOptions.textColor }));
				text.position.x = xy[0] - gridOptions.size / 2;
				text.position.z = xy[1] - gridOptions.size / 2 + (ratio * 0.6);
				text.rotation.x = -Math.PI / 2;
				group.add(text);
			}
		}
	});

	return group;
}