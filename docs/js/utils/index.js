import { distance2Point } from './hilbert.js';

export function gridAlign (gridSize = 10, object, x, z) {
    object.position.x = (x + 0.5) - (gridSize/2);
    object.position.z = (z + 0.5) - (gridSize/2);
    object.position.y = 0.5;
}

const default_cube_geometry = new THREE.BoxGeometry(1, 1, 1);
const default_cube_material = new THREE.MeshNormalMaterial();
export function makeCube (gridSize, x, z = null) {
    const mesh = new THREE.Mesh(default_cube_geometry, default_cube_material);

    if (z === null) {
        const d = distance2Point(x, gridSize);
        x = d[0];
        z = d[1];
    }

    gridAlign(gridSize, mesh, x, z);
    return mesh;
}