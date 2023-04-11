import * as THREE from "three";
import Stats from "stats-js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
let api_url = 'https://ip-api.circleclick.com';
if (query_vars.api_url) {
	api_url = query_vars.api_url;
}

if (query_vars.ip_block) {
	const IP_BLOCK = parseInt(query_vars.ip_block);

	fetch(api_url + '/list/' + IP_BLOCK).then(data => data.json()).then(async function (data) {
		moveCameraToHilbert(data[Math.round(data.length / 2)].asset_start);
		parseRecords(data);
	});
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


function moveCameraToHilbert(number) {
	const [x, y] = distance2Point(number);

	controls.target.x = x * config.scaleMultiplier;
	controls.target.z = y * config.scaleMultiplier;


	camera.position.set(
		x * config.scaleMultiplier + config.cameraDistance,
		config.cameraDistance,
		y * config.scaleMultiplier + config.cameraDistance,
	)
}

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

const gridA = new THREE.GridHelper(65536 * config.scaleMultiplier, 32, 0x774444, 0x444444);
gridA.position.set(65536 * config.scaleMultiplier * 0.5, 0, 65536 * config.scaleMultiplier * 0.5);
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
renderer.domElement.addEventListener('mouseup', (e) => {
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
		if (intersect.object.userData && intersect.object.userData.asset_start) {
			// open link in new tab
			window.open(`https://ip-data-explorer.netlify.app/transfers/${intersect.object.userData.asset_start}/${new Date(intersect.object.userData.transfer_date).getTime()}`, '_blank');
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


import { distance2Point } from "./utils/hilbert";
import getCompanyColor from "./utils/getCompanyColor";

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



async function spawnHilbertMesh(start, end, name = 'hilbert') {
	const data = await getRangeGeometryAsync(start, end);

	const companyColor = new THREE.Color(getCompanyColor(name));

	if (data.isCube) {
		const dummy = new THREE.Object3D();
		dummy.position.x = data.center[0];
		dummy.position.z = data.center[1];
		dummy.scale.x = data.width;
		dummy.scale.z = data.height;

		dummy.updateMatrix();

		const meshIndex = cubeInstance.count;
		cubeInstance.count++;
		cubeInstance.setColorAt(meshIndex, companyColor);
		cubeInstance.setMatrixAt(meshIndex, dummy.matrix);

		cubeInstance.instanceMatrix.needsUpdate = true;
		cubeInstance.instanceColor.needsUpdate = true;
		cubeInstance.needsUpdate = true;

		return { mesh: dummy, isInstance: true, meshIndex };
	} else {
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
				color: companyColor,
			})
		);
		mesh.rotation.x = Math.PI / 2;

		mesh.position.y = 1 + Math.random() * 0.1;

		scene.add(mesh);

		return { mesh };
	}
}


const minDate = new Date('Thu Feb 02 2010').getTime();

window.addEventListener('message', async (event) => {
	const { data } = event;
	if (data.type === 'add_ranges') {
		await parseRecords(data.records);
	} else if (data.type === 'add_range') {
		await parseRecords([data.record]);
	} else if (data.type === 'move_camera') {
		const point = distance2Point(data.distance);
		controls.target.x = point[0];
		controls.target.z = point[1];
		controls.target.y = data.height ?? 0;
		controls.update();
	}
});

async function parseRecords(records) {
	for (let i = 0; i < records.length; i++) {
		const element = records[i];
		spawnHilbertMesh(element.asset_start, element.asset_end, element.to_org || "unknown").then(({ mesh, meshIndex, isInstance }) => {
			const transfer_timestamp = new Date(element.transfer_date).getTime();
			const previous_timestamp = new Date(element.previous_date).getTime();
			const delta = transfer_timestamp - previous_timestamp;

			mesh.position.y = ((transfer_timestamp - minDate) / (Date.now() - minDate)) * config.mapHeight * config.scaleMultiplier;
			mesh.position.y += Math.random() * 0.01 * config.mapHeight * config.scaleMultiplier;

			mesh.userData = element;

			if (isInstance) {
				mesh.updateMatrix();
				cubeInstance.setMatrixAt(meshIndex, mesh.matrix);
				cubeInstance.instanceMatrix.needsUpdate = true;
			}
		})

		if (i % config.geometryBatchSize === 0 && i !== 0) {
			await sleep(1000);
		}

	}
}

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}