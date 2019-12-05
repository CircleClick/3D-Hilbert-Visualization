let renderer, scene, camera, material, grid, orbit = 0;

const gridSize = 16;

import { Grid } from './components/index.js';
import { gridAlign, makeCube } from './utils/index.js';

const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix()
}

const draw = () => {
	requestAnimationFrame( draw );

    orbit+=0.01;
    if(orbit > 360) orbit -= 360;
    camera.position.z = (gridSize*1.3)*Math.cos(orbit);
    camera.position.x = (gridSize*1.3)*Math.sin(orbit);

    camera.rotation.y = orbit;

	renderer.render( scene, camera );
}

const init = () => {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, gridSize*2);
    camera.position.y = gridSize/3;

    scene = new THREE.Scene();

    grid = new Grid({size: gridSize, divisions: gridSize});
    scene.add(grid.grid)

    for (let n = 0; n < gridSize*gridSize; n++) {
        const cube = makeCube(gridSize, n);
        cube.position.y += Math.floor(n / gridSize)
        scene.add(cube);
    }


    renderer = new THREE.WebGLRenderer({ antialias: true });

    resize();
    window.addEventListener('resize', resize);
    document.body.appendChild(renderer.domElement);
    draw();
}

document.addEventListener('DOMContentLoaded', init);