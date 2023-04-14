import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./main.css";
import { distance2Point, hilbertGeometry } from "./utils/hilbert";


const query_vars = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	query_vars[key] = value;
});

let stats = false;
if (query_vars.stats) {
	stats = new Stats();
	stats.showPanel(1);
	document.body.appendChild(stats.dom);
}

/*
** Initiate ThreejS scene
*/

const camera = new THREE.PerspectiveCamera(
	70,
	window.innerWidth / window.innerHeight,
	0.1,
	65536 * 4
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
const cubeInstance = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, 65536);
cubeInstance.frustumCulled = false;
cubeInstance.setColorAt(0, new THREE.Color(0x00ff00));
cubeInstance.count = 0;
scene.add(cubeInstance);

const gridA = new THREE.GridHelper(65536, 32, 0x774444, 0x444444);
gridA.position.set(65536 * 0.5, 0, 65536 * 0.5);
scene.add(gridA);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(.5, 1, .25);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

let lastMouseDown = {
	x: 0,
	y: 0,
	time: 0,
};

renderer.domElement.addEventListener('mousedown', (e) => {
	controls.autoRotate = false;
	lastMouseDown = {
		x: e.clientX,
		y: e.clientY,
		time: new Date().getTime(),
	};
});
renderer.domElement.addEventListener('touchstart', e => {
	controls.autoRotate = false;
	lastMouseDown = {
		x: e.touches[0].clientX,
		y: e.touches[0].clientY,
		time: new Date().getTime(),
	};
})

renderer.domElement.addEventListener('click', (e) => {
	const totalDist = Math.abs(e.clientX - lastMouseDown.x) + Math.abs(e.clientY - lastMouseDown.y);
	if (totalDist > 5) {
		return
	}

	const mouse = new THREE.Vector2();
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.children);
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
})



function resize() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width * window.devicePixelRatio, height * window.devicePixelRatio);
}

window.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('resize', resize);
	if (stats) document.body.appendChild(stats.dom);
	document.body.appendChild(renderer.domElement);
	draw();
})

/*
** Draw loop
*/
let lastFrame = performance.now();
function draw() {
	if (stats) stats.begin();
	requestAnimationFrame(draw);
	const delta = Math.min(1, Math.max(0, (performance.now() - lastFrame) / 1000));
	lastFrame = performance.now();

	controls.update();

	renderer.render(scene, camera);
	if (stats) stats.end();
};

function moveCameraToHilbert(number, distance = 10) {
	const [x, y] = distance2Point(number);

	controls.target.x = x;
	controls.target.z = y;

	camera.position.set(
		x + distance,
		distance,
		y + distance,
	)
}

async function spawnHilbertMesh(start, end, startHeight = 0, endHeight = 1, color = 0xffffff, userData = {}) {
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
	scene.add(mesh);

	mesh.position.y = startHeight;
	mesh.scale.y = endHeight - startHeight;

	mesh.userData = userData;
	return mesh;
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

spawnHilbertMesh(0, 20, 0, 3, 0xff0000, { test: true });
spawnHilbertMesh(21, 39, 1, 2, 0x00ffff, { test: true });
spawnHilbertMesh(40, 48, 2, 3, 0xffffff, { test: true });