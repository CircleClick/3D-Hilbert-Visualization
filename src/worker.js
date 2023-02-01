import * as THREE from "three";
import { distance2Point, hilbertGeometry, outlinePoints } from "./utils/hilbert";

let messageQueue = [];
function queueMessage (message) {
	messageQueue.push(message);
}
function checkMessageQueue () {
	if (messageQueue.length > 0) {
		self.postMessage(messageQueue);
		messageQueue = [];
	}
}

setInterval(checkMessageQueue, 250);

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
			const geometry = hilbertGeometry(data.start, data.end, data.geometryOptions);

			const attributes = {
				position: geometry.getAttribute('position'),
				normal: geometry.getAttribute('normal'),
				uv: geometry.getAttribute('uv'),
			};

			queueMessage({
				data: {
					attributes,
				},
				id: data.id,
			});
			break;
		default:
			console.error("Unknown message type", type);
	}
};