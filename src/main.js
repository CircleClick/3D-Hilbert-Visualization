import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";

import config from "./config";

// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
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

const cameraTarget = new THREE.Vector3(0, 0, 0);

function moveCameraToHilbert(number) {
	const [x, y] = distance2Point(number);
	cameraTarget.x = x * config.scaleMultiplier;
	cameraTarget.z = y * config.scaleMultiplier;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#222222');

const gridA = new THREE.GridHelper(65536 * config.scaleMultiplier, Math.round(65536 * 0.0025), 0x444444, 0x444444);
gridA.position.set(65536 * config.scaleMultiplier * 0.5, 0, 65536 * config.scaleMultiplier * 0.5);
scene.add(gridA);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(.5, 1, .25);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.domElement.addEventListener('click', (e) => {
	const mouse = new THREE.Vector2();
	mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.children);
	if (intersects.length > 0) {
		const intersect = intersects[0];
		console.log(intersect.object.userData);

		// open link in new tab
		window.open(`https://ip-data-explorer.netlify.app/transfers/${intersect.object.userData.asset_start}/${new Date(intersect.object.userData.transfer_date).getTime()}`, '_blank');
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

	camera.position.x = Math.sin(performance.now() / 10000 + Math.PI) * config.cameraDistance + cameraTarget.x;
	camera.position.z = Math.cos(performance.now() / 10000 + Math.PI) * config.cameraDistance + cameraTarget.z;
	camera.position.y = config.cameraDistance + cameraTarget.y;
	camera.lookAt(cameraTarget.x, cameraTarget.y, cameraTarget.z);

	renderer.render(scene, camera);
	if (stats) stats.end();
};


import { distance2Point } from "./utils/hilbert";

let currentTaskID = 0;
const taskQueue = [];
const workerListener = (messages) => {
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
const workers = [];
for (let i = 0; i < config.workerThreads; i++) {
	const worker = new Worker(new URL('./worker.js', import.meta.url));
	worker.onmessage = workerListener;
	workers.push(worker);
}

let workerIndex = 0;
function getWorker() {
	const worker = workers[workerIndex];
	workerIndex++;
	if (workerIndex >= workers.length) workerIndex = 0;
	return worker;
}



function getRangeGeometryAsync(start, end, geometryOptions = {}) {
	return new Promise((resolve, reject) => {
		currentTaskID++;
		taskQueue.push({
			id: currentTaskID,
			timestamp: performance.now(),
			resolve: resolve,
			reject: reject,
		});
		getWorker().postMessage({
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
			color: new THREE.Color(`hsl(${Math.random() * 360}, 75%, 60%)`),
		})
	);
	mesh.rotation.x = Math.PI / 2;

	mesh.position.y = 1 + Math.random() * 0.1;

	scene.add(mesh);

	return mesh;
}

moveCameraToHilbert(2147483648);

fetch('https://ip-api.circleclick.com/org/rir/apnic').then(data => data.json()).then(async function (data) {
	parseRecords(data.transfers);

	fetch('https://ip-api.circleclick.com/org/rir/ripe%20ncc').then(data => data.json()).then(async function (data) {
		parseRecords(data.transfers);
	});
	fetch('https://ip-api.circleclick.com/org/rir/arin').then(data => data.json()).then(async function (data) {
		parseRecords(data.transfers);
	});
	fetch('https://ip-api.circleclick.com/org/rir/afrinic').then(data => data.json()).then(async function (data) {
		parseRecords(data.transfers);
	});
	fetch('https://ip-api.circleclick.com/org/rir/ripe').then(data => data.json()).then(async function (data) {
		parseRecords(data.transfers);
	});
	fetch('https://ip-api.circleclick.com/org/rir/lacnic').then(data => data.json()).then(async function (data) {
		parseRecords(data.transfers);
	});
});


async function parseRecords(records) {
	for (let i = 0; i < records.length; i++) {
		const element = records[i];
		spawnHilbertMesh(element.asset_start, element.asset_end).then(mesh => {
			const transfer_timestamp = new Date(element.transfer_date).getTime();
			const previous_timestamp = new Date(element.previous_date).getTime();
			const delta = transfer_timestamp - previous_timestamp;


			mesh.position.y = (transfer_timestamp / Date.now()) * config.mapHeight * config.scaleMultiplier;
			mesh.scale.z = (delta / Date.now()) * config.mapHeight * config.scaleMultiplier;

			mesh.userData = element;
		})

		if (i % config.geometryBatchSize === 0 && i !== 0) {
			await sleep(1000);
		}

	}
}
function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}