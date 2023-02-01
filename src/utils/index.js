import * as THREE from "three";
import { distance2Point } from './hilbert.js';

export function gridAlign(gridSize = 65536, object, x, z) {
	object.position.x = (x + 0.5) - (gridSize / 2);
	object.position.z = (z + 0.5) - (gridSize / 2);
	object.position.y = 0.5;
}

const default_cube_geometry = new THREE.BoxGeometry(1, 1, 1);
const default_cube_material = new THREE.MeshNormalMaterial();
export function makeCube(gridSize, x, z = null, material = default_cube_material) {
	const mesh = new THREE.Mesh(default_cube_geometry, material);

	if (z === null) {
		const d = distance2Point(x, gridSize);
		x = d[0];
		z = d[1];
	}

	gridAlign(gridSize, mesh, x, z);
	return mesh;
}

export function scaleCube(cube, scale) {
	cube.scale.x = scale;
	cube.scale.z = scale;

	cube.position.x += scale / 2 - 0.5;
	cube.position.z += scale / 2 - 0.5;
}

export function shadowCube(gridSize, n, height, scale) {
	const shadow = makeCube(gridSize, n, null, new THREE.MeshNormalMaterial());

	shadow.material.transparent = true;
	shadow.material.opacity = 0.25;
	shadow.scale.y = height;
	shadow.position.y += height / 2 - 0.5;

	scaleCube(shadow, scale);

	return shadow;
}