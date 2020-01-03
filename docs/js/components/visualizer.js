import { Grid } from './index.js';
import { gridAlign, makeCube, scaleCube, shadowCube } from '../utils/index.js';

export class Visualizer {
    constructor (options = {}) {
        this.options = Object.assign({
            domTarget: document.body,
            enableOrbitControls: true,
            gridSize: 16,
        }, options)

        if (this.options.enableOrbitControls) this.initiateOrbitControls();

        this.elements = [];
        this.camera = null;
        window.requestAnimationFrame(this.init.bind(this));
    }

    init () {
        this.camera = new THREE.PerspectiveCamera(70, this.options.domTarget.offsetWidth / this.options.domTarget.offsetHeight, 0.01, this.options.gridSize * 3);
        this.group = new THREE.Group();

        this.scene = new THREE.Scene();
        this.scene.add(this.group);
        this.scene.background = new THREE.Color('#FFFFFF');

        const grid = new Grid({
            size: this.options.gridSize,
            divisions: this.options.gridSize,
        });
        this.group.add(grid.group);

        this.populateRandomData();


        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        window.addEventListener('resize', this.resize.bind(this));
        this.options.domTarget.appendChild(this.renderer.domElement);
        this.resize();
        this.draw();
    }

    draw () {
        requestAnimationFrame(this.draw.bind(this));

        this.camera.position.y = (this.options.gridSize * 0.25);
        this.camera.position.z = (this.options.gridSize * 1.5);

        this.group.rotation.y = -this.orbitControls.orbitX;
        this.group.rotation.x = -this.orbitControls.orbitY / 2;

        this.renderer.render(this.scene, this.camera);
    }

    resize () {
        this.renderer.setSize(this.renderer.domElement.offsetWidth, this.renderer.domElement.offsetHeight);
        this.camera.aspect = this.renderer.domElement.offsetWidth / this.renderer.domElement.offsetHeight;
        this.camera.updateProjectionMatrix();
    }

    populateRandomData () {
        for (let index = 0; index < 10; index++) {
            const coord = Math.floor(Math.random()*(this.options.gridSize*this.options.gridSize));
            const height = Math.random() * this.options.gridSize;
            let scale = Math.floor(Math.random() * 5);

            if (scale > 1 && Math.random() > 0.5) scale -= 1;
            if (scale > 1 && Math.random() > 0.5) scale -= 1;

            const cube = makeCube(this.options.gridSize, coord);
            scaleCube(cube, scale);
            cube.position.y += height;
            this.group.add(cube);
            const cubeShadow = shadowCube(this.options.gridSize, coord, height, scale);
            this.group.add(cubeShadow);
        }
    }

    initiateOrbitControls () {

        this.orbitControls = {
            click_startX: 0,
            click_startY: 0,
            orbitX: -0.785,
            orbitY: -0.87,
            startorbitX: -0.785,
            startOrbitY: -0.87,
            click_active: false,
        };
        this.options.domTarget.addEventListener('mousedown', (e) => {
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

        this.options.domTarget.addEventListener('mousemove', (e) => {
            if (this.orbitControls.click_active) {
                this.orbitControls.orbitX = this.orbitControls.startorbitX - (e.clientX - this.orbitControls.click_startX) / 200;
                this.orbitControls.orbitY = this.orbitControls.startOrbitY - (e.clientY - this.orbitControls.click_startY) / 100;
            }
        })
    }
}
