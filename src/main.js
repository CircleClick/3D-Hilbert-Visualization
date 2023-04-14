import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./main.css";
import { distance2Point, hilbertGeometry } from "./utils/hilbert";

const DefaultOptions = {
	hilbertSize: 32,


}
class HilbertVisualizer {
	constructor(userOptions) {
		this.options = Object.assign({}, DefaultOptions, userOptions);

		this.gridSize = Math.sqrt(Math.pow(2, this.options.hilbertSize));

		/*
		** Initiate ThreejS scene
		*/

		const camera = new THREE.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			0.1,
			this.gridSize * 4
		);
		camera.position.z = 10;
		camera.position.y = 10;
		camera.lookAt(0, 0, 0);

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#222222');

		const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
		const cubeMaterial = new THREE.MeshPhongMaterial({
			color: 0xffffff,
		});
		const cubeInstance = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, this.gridSize);
		cubeInstance.frustumCulled = false;
		cubeInstance.setColorAt(0, new THREE.Color(0x00ff00));
		cubeInstance.count = 0;
		scene.add(cubeInstance);

		const gridA = new THREE.GridHelper(this.gridSize, 32, 0x774444, 0x444444);
		gridA.position.set(this.gridSize * 0.5, 0, this.gridSize * 0.5);
		scene.add(gridA);

		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(.5, 1, .25);
		scene.add(light);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
		});
		renderer.domElement.style.width = '100%';
		renderer.domElement.style.height = '100%';
		this.lastFrame = performance.now();

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.listenToKeyEvents(window);
		controls.autoRotate = true;
		controls.autoRotateSpeed = 0.5;

		this.scene = scene;
		this.camera = camera;
		this.renderer = renderer;
		this.controls = controls;

		this.lastMouseDown = {
			x: 0,
			y: 0,
			time: 0,
		};

		renderer.domElement.addEventListener('mousedown', this.mouseDownListener.bind(this));
		renderer.domElement.addEventListener('touchstart', this.touchStartListener.bind(this));
		renderer.domElement.addEventListener('click', this.clickListener.bind(this));

		this.resizeObserver = new ResizeObserver(this.resizeListener.bind(this));
		this.resizeObserver.observe(renderer.domElement);
		this.resizeListener();

		this.draw();
	}


	draw() {
		if (this.stats) this.stats.begin();
		requestAnimationFrame(this.draw.bind(this));
		const delta = Math.min(1, Math.max(0, (performance.now() - this.lastFrame) / 1000));
		this.lastFrame = performance.now();

		this.controls.update();

		this.renderer.render(this.scene, this.camera);
		if (this.stats) this.stats.end();
	};

	mouseDownListener(e) {
		this.controls.autoRotate = false;
		this.lastMouseDown = {
			x: e.clientX,
			y: e.clientY,
			time: new Date().getTime(),
		};
	}

	touchStartListener(e) {
		this.controls.autoRotate = false;
		this.lastMouseDown = {
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
			time: new Date().getTime(),
		};
	}

	clickListener(e) {
		const totalDist = Math.abs(e.clientX - this.lastMouseDown.x) + Math.abs(e.clientY - this.lastMouseDown.y);
		if (totalDist > 5) {
			return
		}
		const mouse = new THREE.Vector2();
		mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, this.camera);
		const intersects = raycaster.intersectObjects(this.scene.children);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			if (intersect.object.userData) {
				//send message to parent window
				window.parent.postMessage({
					type: 'click',
					data: intersect.object.userData,
				});
				console.log('clicked data:', intersect.object.userData);
			} else {
				console.log('Click', intersect);
			}
		}
	}

	resizeListener() {
		const width = this.renderer.domElement.clientWidth;
		const height = this.renderer.domElement.clientHeight;
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width * window.devicePixelRatio, height * window.devicePixelRatio, false);
	}

	moveCameraToHilbert(number, distance = 10) {
		const [x, y] = distance2Point(number);

		this.controls.target.x = x;
		this.controls.target.z = y;

		this.camera.position.set(
			x + distance,
			distance,
			y + distance,
		)
	}

	async spawnHilbertMesh(start, end, startHeight = 0, endHeight = 1, color = 0xffffff, userData = {}) {
		const data = await hilbertGeometry(start, end);
		const geometry = new THREE.BufferGeometry();
	
		const geometryAttributes = data.attributes;
		for (const key in geometryAttributes) {
			if (Object.hasOwnProperty.call(geometryAttributes, key)) {
				const value = geometryAttributes[key];
				geometry.setAttribute(
					key,
					new THREE.BufferAttribute(value.array, value.itemSize)
				);
			}
		}
	
		geometry.rotateX(Math.PI / 2);
		geometry.translate(0.5, 1, 0.5);
	
		const mesh = new THREE.Mesh(
			geometry,
			new THREE.MeshPhongMaterial({
				color: new THREE.Color(color),
			})
		);
		this.scene.add(mesh);
	
		mesh.position.y = startHeight;
		mesh.scale.y = endHeight - startHeight;
	
		mesh.userData = userData;
		return mesh;
	}
}



window.addEventListener('message', async (event) => {
	const { data } = event;
	switch (data.type) {
		case 'add_range':
			await spawnHilbertMesh(data.start, data.end, data.startHeight, data.endHeight, data.color, data.userData);
			break;
		case 'add_ranges':
			for (const range of data.ranges) {
				await spawnHilbertMesh(range.start, range.end, data.startHeight, data.endHeight, range.color, range.userData);
			}
		case 'move_camera':
			moveCameraToHilbert(data.point, data.cameraDistance);
			break;
	}
});


const visualizer = new HilbertVisualizer();
document.body.appendChild(visualizer.renderer.domElement);

visualizer.spawnHilbertMesh(0, 20, 0, 3, 0xff0000, { test: true });
visualizer.spawnHilbertMesh(21, 39, 1, 2, 0x00ffff, { test: true });
visualizer.spawnHilbertMesh(40, 48, 2, 3, 0xffffff, { test: true });