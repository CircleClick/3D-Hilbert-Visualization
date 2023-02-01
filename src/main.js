import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";


// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
const query_vars = {};
const query_parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
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
	65536 * 2
);
camera.position.z = 10;
camera.position.y = 10;
camera.lookAt(0, 0, 0);

const cameraTarget = new THREE.Vector3(0, 0, 0);
let cameraDistance = 30;

function moveCameraToHilbert(number) {
	const [x, y] = distance2Point(number);
	cameraTarget.x = x;
	cameraTarget.z = y;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#FFFFFF');

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(.5, 1, .25);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

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

	visualizer.addCube(172, ratio(167987), 1);
	visualizer.addCube(179, ratio(49033), 1);
	visualizer.addCube(155, ratio(595001), 1);
	visualizer.addCube(139, ratio(1182), 1);
	visualizer.addCube(210, ratio(474), 1);
	visualizer.addCube(240, ratio(870), 1);
	visualizer.addCube(151, ratio(16361), 1);
	visualizer.addCube(114, ratio(4148), 1);
	visualizer.addCube(187, ratio(312), 1);
	visualizer.addCube(135, ratio(202), 1);

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

	camera.position.x = Math.sin(performance.now() / 10000) * cameraDistance + cameraTarget.x;
	camera.position.z = Math.cos(performance.now() / 10000) * cameraDistance + cameraTarget.z;
	camera.position.y = cameraDistance / 2 + cameraTarget.y;
	camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);

	renderer.render(scene, camera);
	if (stats) stats.end();
};


import { Visualizer } from './components/index.js';
import { gridAlign } from "./utils";
import { distance2Point } from "./utils/hilbert";

const ratio = (n) => {
	return (n / 595001) * 16;
}


const visualizer = new Visualizer({
	populateRandomData: false,
	renderer: renderer,
	scene: scene,
});


let currentTaskID = 0;
const taskQueue = [];

const worker = new Worker(new URL('./worker.js', import.meta.url));
worker.onmessage = (messages) => {
	for (let i = 0; i < messages.data.length; i++) {
		const { data, id } = messages.data[i];
		let taskFound = false;

		for (let index = 0; index < taskQueue.length; index++) {
			const element = taskQueue[index];
			if (element.id === id) {
				element.resolve(data);
				taskQueue.splice(index, 1);
				taskFound = true;
				break;
			}
		}

		if (!taskFound) console.log('task not found', id, data);
	}
};


function getRangeGeometryAsync(start, end, geometryOptions = {}) {
	return new Promise((resolve, reject) => {
		currentTaskID++;
		taskQueue.push({
			id: currentTaskID,
			timestamp: performance.now(),
			resolve: resolve,
			reject: reject,
		});
		worker.postMessage({
			type: "hilbert_geometry",
			data: {
				start: start,
				end: end,
				geometryOptions,
				id: currentTaskID,
			},
		});
	});
}



async function spawnHilbertMesh(start, end) {
	const data = await getRangeGeometryAsync(start, end);
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

	const mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshPhongMaterial({
			side: THREE.DoubleSide,
			color: new THREE.Color(`hsl(${Math.random() * 360}, 75%, 60%)`),
		})
	);
	mesh.rotation.x = Math.PI / 2;

	mesh.position.y = 1;

	scene.add(mesh);
}

spawnHilbertMesh(128, 192);
spawnHilbertMesh(0, 32);
spawnHilbertMesh(37, 64);

moveCameraToHilbert(0);