import './style.css'

import HilbertVisualizer from '../index.js';


const visualizer = new HilbertVisualizer();
document.body.appendChild(visualizer.renderer.domElement);

visualizer.spawnHilbertMesh(0, 20, 0, 3, 0xc92a3d, { id: 1 });
visualizer.spawnHilbertMesh(21, 39, 0, 2, 0xf1a239, { id: 2 });
visualizer.spawnHilbertMesh(40, 48, 0, 3, 0x3ca7db, { id: 3 });
visualizer.spawnHilbertMesh(0, 255, -1, 0, 0x3d6be0, { id: 4 });