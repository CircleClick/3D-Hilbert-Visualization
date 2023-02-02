import * as THREE from "three";
import { distance2Point, hilbertGeometry, outlinePoints } from "./utils/hilbert";

let messageQueue = [];
let timeout = false;
function queueMessage (message) {
	messageQueue.push(message);
	if (!timeout) {
		timeout = true;
		setTimeout(() => {
			checkMessageQueue();
			timeout = false;
		}, 10);
	}
}
function checkMessageQueue () {
	if (messageQueue.length > 0) {
		self.postMessage(messageQueue);
		messageQueue = [];
	}
}


function getHilbertOutline(data) {
	const points = [];
	for (let i = data.start; i <= data.end; i++) {
		points.push(distance2Point(i));
	}
	let start_time = performance.now();
	const outline = outlinePoints(points);
	for (let index = 0; index < outline.length; index++) {
		outline[index] = new THREE.Vector2(outline[index][0], outline[index][1]);
	}

	console.log("outline", performance.now() - start_time);

	queueMessage({
		data: outline,
		id: data.id,
	});
}

self.onmessage = ({ data: { type, data, id } }) => {
	switch (type) {
		case "hilbert_outline":
			getHilbertOutline(data);
			break;
		case "hilbert_geometry":
			const geometry = hilbertGeometry(data.start, data.end, data.geometryOptions).toNonIndexed();

			const attributes = {};

			for (const key in geometry.attributes) {
				if (Object.hasOwnProperty.call(geometry.attributes, key)) {
					const element = geometry.attributes[key];
					attributes[key] = {
						array: element.array,
						itemSize: element.itemSize,
					};
				}
			}

			queueMessage({
				data: {
					attributes,
					groups: geometry.groups,
				},
				id: data.id,
			});
			break;
		default:
			console.error("Unknown message type", type);
	}
};